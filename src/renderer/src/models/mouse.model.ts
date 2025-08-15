/*
 * @Author: shufei.han
 * @Date: 2024-11-22 16:32:08
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-25 17:17:43
 * @FilePath: \gl-kvm-frontend\src\models\mouse.model.ts
 * @Description: 鼠标控制
 */
// import { useMsgStore } from "@renderer/stores/modules/message";
import { getGeometry, remap, sendHidEvent } from "./session.model";
import { browser } from "@renderer/tools";
// import { useKvmStore, type KvmConfigState } from '@renderer/stores/modules/kvm'
import { sleep } from "@gl/main";
import { DEFAULT_MOUSE_POLLING, DEFAULT_RELATIVE_SENSE, DEFAULT_SCROLL_RATE } from "./hid.model";
import type { WebSocketService } from "@renderer/api/websocket";
// import { useServerStorageStore } from '@renderer/stores/modules/serverStorage'
// import { ServerStorageKeys, type ServerStorageInfo } from './storage.model'

// const msgStore = useMsgStore();
/** 鼠标事件类型枚举 */
export enum MouseButton {
  left = 0,
  middle = 1,
  right = 2,
  up = 3,
  down = 4,
}
/** 鼠标事件对象类型枚举 */
export enum MouseEventType {
  MOUSE_BUTTON = "mouse_button",
  MOUSE_MOVE = "mouse_move",
  MOUSE_RELATIVE = "mouse_relative",
  MOUSE_WHEEL = "mouse_wheel",
}
/** 鼠标消息格式 */
export interface KvmMouseEvent<T = any> {
  event_type: MouseEventType;
  event: T;
}
/** 鼠标类型对应的后端接受的key */
export const MouseButtonMap = new Map([
  [MouseButton.left, "left"],
  [MouseButton.middle, "middle"],
  [MouseButton.right, "right"],
  [MouseButton.up, "up"],
  [MouseButton.down, "down"],
]);

const cumulativeScrolling = !(browser.is_firefox && !browser.is_mac);

interface DeltaInfo {
  x: number;
  y: number;
}
/** 鼠标事件处理类 */
export class MouseEventHandler {
  private planned_pos = { x: 0, y: 0 };
  private relative_touch_pos: DeltaInfo = null;
  private sent_pos = { x: 0, y: 0 };
  private scroll_delta = { x: 0, y: 0 };
  /** 鼠标是否hover在视频上面 */
  public streamHovered = false;
  /** 鼠标是否hover在视频上面 */
  private configState: any = {};
//   private serverStorage: ServerStorageInfo;
  /** 鼠标滚轮速率 */
  private relative_deltas: DeltaInfo[] = [];
  private timer: number;
//   private kvmSore = useKvmStore();

  constructor(private el: HTMLElement, private videoId: string, private apiWs: WebSocketService) {
    // this.configState = useKvmStore().configState;
    // this.serverStorage = useServerStorageStore().storage;
    log('[mouse] init', this.el, this.videoId);
    this.bindEvents();
    this.updateRate();
  }

  // private get videoId() {
  //   return this.kvmSore.videoElId;
  // }

  public get absolute() {
    return true
    // return !(msgStore.hidState?.mouse?.absolute === false);
  }
  /** 计算鼠标polling */
  public get computedMousePolling() {
      return DEFAULT_MOUSE_POLLING;
    // if (this.absolute) {
    // }
    // return this.serverStorage[ServerStorageKeys.MOUSE_POLLING];
  }
  /** 绑定事件 */
  private bindEvents() {
    this.el.addEventListener("wheel", (e) => this.onMouseWheelScroll(e));
    this.el.addEventListener("mouseenter", (e) =>
      this.onMouseLeaveOrEnter(e, true)
    );
    this.el.addEventListener("mouseleave", (e) =>
      this.onMouseLeaveOrEnter(e, false)
    );
    this.el.addEventListener("contextmenu", (e) => e.preventDefault());
    this.el.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.el.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.el.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.el.addEventListener("touchmove", (e) => this.onTouchMove(e));
    this.el.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.el.addEventListener("touchend", () => this.onTouchEnd());
  }

  private onTouchStart(event: TouchEvent) {
    // event.preventDefault()
    if (event.touches.length === 1) {
      if (this.absolute) {
        this.planned_pos = this.getTouchPosition(event.touches[0]);
        this.sendPlannedMove();
      } else {
        this.relative_touch_pos = this.getTouchPosition(event.touches[0]);
      }
    }
  }

  private onTouchEnd() {
    // event.preventDefault()
    this.sendPlannedMove();
  }

  /** 触摸移动事件（移动端兼容） */
  private onTouchMove(event: TouchEvent) {
    // event.preventDefault()
    // @ts-ignore
    if (event.target.id !== this.videoId) {
      return;
    }
    if (event.touches.length === 1) {
      if (this.absolute) {
        this.planned_pos = this.getTouchPosition(event.touches[0]);
      } else if (this.relative_touch_pos === null) {
        this.relative_touch_pos = this.getTouchPosition(event.touches[0]);
      } else {
        const pos = this.getTouchPosition(event.touches[0]);
        this.sendOrPlanRelativeMove({
          x: pos.x - this.relative_touch_pos.x,
          y: pos.y - this.relative_touch_pos.y,
        });
        this.relative_touch_pos = pos;
      }
    }
  }

  private getTouchPosition(touch: Touch): DeltaInfo {
    // @ts-ignore
    if (touch.target?.getBoundingClientRect) {
      // @ts-ignore
      const rect = touch.target.getBoundingClientRect();
      return {
        x: Math.round(touch.clientX - rect.left),
        y: Math.round(touch.clientY - rect.top),
      };
    }
    return null;
  }

  /** 鼠标进入或离开事件 */
  private onMouseLeaveOrEnter(event: MouseEvent, enter: boolean) {
    this.streamHovered = enter;
  }
  /** 鼠标滚轮事件 */
  private onMouseWheelScroll(event: WheelEvent) {
    event.preventDefault();
    const delta = { x: 0, y: 0 };
    // if ($("hid-mouse-cumulative-scrolling-switch").checked) {
    if (cumulativeScrolling) {
      const factor = browser.is_mac ? 5 : 1;

      this.scroll_delta.x += event.deltaX * factor; // Horizontal scrolling
      if (Math.abs(this.scroll_delta.x) >= 100) {
        delta.x =
          (this.scroll_delta.x / Math.abs(this.scroll_delta.x)) *
          -DEFAULT_SCROLL_RATE;
        this.scroll_delta.x = 0;
      }

      this.scroll_delta.y += event.deltaY * factor; // Vertical scrolling
      if (Math.abs(this.scroll_delta.y) >= 100) {
        delta.y =
          (this.scroll_delta.y / Math.abs(this.scroll_delta.y)) *
          -DEFAULT_SCROLL_RATE;
        this.scroll_delta.y = 0;
      }
    } else {
      if (event.deltaX !== 0) {
        delta.x =
          (event.deltaX / Math.abs(event.deltaX)) *
          -DEFAULT_SCROLL_RATE;
      }
      if (event.deltaY !== 0) {
        delta.y =
          (event.deltaY / Math.abs(event.deltaY)) *
          -DEFAULT_SCROLL_RATE;
      }
    }

    this.sendScroll(delta);
  }

  private get isPointerLocked() {
    return document.pointerLockElement === this.el;
  }

  /** 鼠标移动事件 */
  private onMouseMove(event: MouseEvent) {
    log('mousemove', event);
    event.preventDefault();
    if (this.absolute) {
      // @ts-ignore
      const rect = event.target.getBoundingClientRect();
      this.planned_pos = {
        x: Math.max(Math.round(event.clientX - rect.left), 0),
        y: Math.max(Math.round(event.clientY - rect.top), 0),
      };
    } else if (this.isPointerLocked) {
      const { movementX: x, movementY: y } = event;
      this.sendOrPlanRelativeMove({ x, y });
    }
  }

  private sendOrPlanRelativeMove(delta: DeltaInfo) {
    delta = {
      x: Math.min(
        Math.max(
          -127,
          Math.floor(
            (delta.x * DEFAULT_RELATIVE_SENSE) /
              10
          )
        ),
        127
      ),
      y: Math.min(
        Math.max(
          -127,
          Math.floor(
            (delta.y * DEFAULT_RELATIVE_SENSE) /
              10
          )
        ),
        127
      ),
    };
    if (this.configState.squashRelativeMoves) {
      this.relative_deltas.push(delta);
    } else {
      this.sendEvent({
        event_type: MouseEventType.MOUSE_RELATIVE,
        event: { delta },
      });
    }
  }

  private sendPlannedMove() {
    if (this.absolute) {
      if (
        this.planned_pos.x !== this.sent_pos.x ||
        this.planned_pos.y !== this.sent_pos.y
      ) {
        // log('sendPlannedMove', this.planned_pos)
        const { x, y } = this.planned_pos;
        const geo = getGeometry(this.videoId);
        const remapX = remap(x, geo.x, geo.width, -32768, 32767);
        const remapY = remap(y, geo.y, geo.height, -32768, 32767);
        this.sendEvent({
          event_type: MouseEventType.MOUSE_MOVE,
          event: { to: { x: remapX, y: remapY } },
        });
        this.sent_pos = this.planned_pos;
      }
    } else if (this.relative_deltas.length) {
      this.sendEvent({
        event_type: MouseEventType.MOUSE_RELATIVE,
        event: { delta: this.relative_deltas, squash: true },
      });
      this.relative_deltas = [];
    }
  }

  /** 鼠标按下事件 */
  private onMouseDown(event: MouseEvent) {
    event.preventDefault();
    // @ts-ignore
    if (
      // @ts-ignore
      (this.absolute && event.target.id === this.videoId) ||
      // @ts-ignore
      event.target.id === "hdmi-lost"
    ) {
      const params = {
        event_type: MouseEventType.MOUSE_BUTTON,
        event: { button: MouseButtonMap.get(event.button), state: true },
      };
      this.sendEvent(params);
    }
    // @ts-ignore
    else if (this.isPointerLocked && event.target.id === "stream-box") {
      // 如果是相对模式，则直接发送鼠标按下事件
      const params = {
        event_type: MouseEventType.MOUSE_BUTTON,
        event: { button: MouseButtonMap.get(event.button), state: true },
      };
      this.sendEvent(params);
    }
  }
  /** 鼠标抬起事件 */
  private onMouseUp(event: MouseEvent) {
    event.preventDefault();
    const params = {
      event_type: MouseEventType.MOUSE_BUTTON,
      event: { button: MouseButtonMap.get(event.button), state: false },
    };
    this.sendEvent(params);
  }
  /** 发送鼠标滚轮事件 */
  private sendScroll(delta: DeltaInfo) {
    if (delta.x || delta.y) {
    //   if (
    //     [ReverseScrolling.BOTH, ReverseScrolling.VERTICAL].includes(
    //       this.serverStorage[ServerStorageKeys.REVERSE_SCROLLING]
    //     )
    //   ) {
    //     delta.y *= -1;
    //   }
    //   if (
    //     [ReverseScrolling.BOTH, ReverseScrolling.HORIZONTAL].includes(
    //       this.serverStorage[ServerStorageKeys.REVERSE_SCROLLING]
    //     )
    //   ) {
    //     delta.x *= -1;
    //   }
      this.sendEvent({
        event_type: MouseEventType.MOUSE_WHEEL,
        event: { delta },
      });
    }
  }
  /** 发送鼠标事件 */
  private sendEvent<T>(data: KvmMouseEvent<T>) {
    // if (
    //   this.serverStorage[ServerStorageKeys.MOUSE_CONTROL] &&
    //   this.kvmSore.mouseEnabled
    // ) {
      sendHidEvent(this.apiWs, data);
    // }
  }

  private async updateRate() {
    this.timer && clearTimeout(this.timer);
    await sleep(this.computedMousePolling);
    this.sendPlannedMove();
    this.updateRate();
  }
}
