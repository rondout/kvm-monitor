import type { WebSocketService } from '@renderer/api/websocket'
import { SelectOptions, type BaseData } from '@gl/main'
import { useWsMessage } from './message.model'
import { MouseEventHandler } from './mouse.model'
import { $ } from './janus.model'
import { KeyboardEventHandler } from '@renderer/tools/keyboard'

export enum KvmDeviceModel {
  RM1 = 'RM1',
  RM1PE = 'RM1PE',
  RM10 = 'RM10'
}

export const deviceModelSelectOptions = [
  new SelectOptions(KvmDeviceModel.RM1, 'RM1'),
  new SelectOptions(KvmDeviceModel.RM1PE, 'RM1PE'),
  new SelectOptions(KvmDeviceModel.RM10, 'RM10')
]

export interface KvmDeviceInfo extends BaseData {
  ip: string
  password: string
  deviceModel: KvmDeviceModel
  name: string
  cookie?: string
}

export enum WsEventType {
  PONG = 'pong',
  // INFO_META_STATE = 'info_meta_state',
  // INFO_HW_STATE = 'info_hw_state',
  // INFO_FAN_STATE = 'info_fan_state',
  // INFO_SYSTEM_STATE = 'info_system_state',
  // INFO_EXTRAS_STATE = 'info_extras_state',
  // GPIO_MODEL_STATE = 'gpio_model_state',
  // GPIO_STATE = 'gpio_state',
  HID_KEYMAPS_STATE = 'hid_keymaps',
  HID_STATE = 'hid',
  ATX_STATE = 'atx',
  MSD_STATE = 'msd',
  STREAMER_STATE = 'streamer',
  // STREAMER_OCR_STATE = 'streamer_ocr_state',
  // 新增
  FINGERBOT_STATE = 'fingerbot',
  TURN_STATE = 'turn'
}

export interface WsMessage<T = any> {
  event_type: WsEventType
  event: T
}

export class KvmStreamConnector {
  private videoEl: HTMLVideoElement
  private videoBox: HTMLDivElement

  public mouseHandler: MouseEventHandler
  public keyboardHandler: KeyboardEventHandler

  constructor(
    private kvm: KvmDeviceInfo,
    private videoElSelector: string,
    private videoBoxElSelector: string
  ) {
    this.videoEl = $(this.videoElSelector)
    this.videoBox = $(this.videoBoxElSelector)
    this.initApiWsSocket()
    // this.initMouseEvent();
  }

  private initApiWsSocket() {
    useWsMessage(this.kvm, (ws) => this.initMouseEvent(ws))
  }

  private initMouseEvent(ws: WebSocketService) {
    this.mouseHandler = new MouseEventHandler(this.videoBox, this.videoElSelector, ws)
    this.keyboardHandler = new KeyboardEventHandler(this.videoBox, ws)
  }
}
