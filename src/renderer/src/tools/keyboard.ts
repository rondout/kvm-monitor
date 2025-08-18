import { AllKeyboardKeys } from '@renderer/models/keyboard.model'
// import { useKvmStore } from '@/stores/modules/kvm'
import { ref } from 'vue'
import { browser } from '.'
// import { useMsgStore } from '@/stores/modules/message'
import { sendHidEvent } from '@renderer/models/session.model'
import { WebSocketService } from '@renderer/api/websocket'
// import { ServerStorageKeys } from '@/models/storage.model'

/** 键盘事件处理 */
export class KeyboardEventHandler {
  /** 全局的变量，用来存储键盘按下的键 */
  public keydownKeys = new Set<AllKeyboardKeys>()
  /** 虚拟键盘这儿存储的按下的控制键（之所以这里用ref，是因为界面上需要根据这个值的变化作展示：按下的时候虚拟按键背景色变化） */
  public virtualKeyboardPressedControlKeys = ref(new Set<AllKeyboardKeys>())
  /** 规定这些是操控按键，操控按键在虚拟键盘上点击的时候要被视为长按 */
  static ControlKeys = [
    AllKeyboardKeys.ShiftLeft,
    AllKeyboardKeys.ShiftRight,
    AllKeyboardKeys.ControlLeft,
    AllKeyboardKeys.ControlRight,
    AllKeyboardKeys.AltLeft,
    AllKeyboardKeys.AltRight,
    AllKeyboardKeys.MetaLeft,
    AllKeyboardKeys.Win
  ]
  /**
   * @description 判断是否是操控按键
   */
  public static isControlKey(key: AllKeyboardKeys) {
    return KeyboardEventHandler.ControlKeys.includes(key)
  }

  // private configState: KvmConfigState
  private get keyboardControl() {
    return true
    // return useServerStorageRef(ServerStorageKeys.KEYBOARD_CONTROL).value
  }

  private keyboardEnabled: boolean = true

  public setKeyboardEnabled(enabled: boolean) {
    this.keyboardEnabled = enabled
  }

  constructor(
    private el: HTMLElement,
    private apiWS: WebSocketService
  ) {
    console.log('init keyboard', this.el)

    this.init()
    // this.configState = useKvmStore().configState
  }

  private init() {
    this.el.addEventListener('keydown', (event) => {
      console.log('keydown event:', event)
      event.preventDefault()
      this.onKeyDownOrUp((event.code || event.key) as AllKeyboardKeys, true, this.keyboardControl)
    })
    this.el.addEventListener('keyup', (event) => {
      event.preventDefault()
      this.onKeyDownOrUp((event.code || event.key) as AllKeyboardKeys, false, this.keyboardControl)
    })
  }

  public onKeyDownOrUp(
    key: AllKeyboardKeys,
    down: boolean,
    enable = true,
    isVirtualKeyboard = false
  ) {
    console.log('key: ', { key, down, enable, isVirtualKeyboard })
    if (!enable) return
    // enable combo keys 当前版本暂不实现  因此写死false
    const ENABLE_COMBO_KEYS = false
    if (ENABLE_COMBO_KEYS && isVirtualKeyboard && KeyboardEventHandler.isControlKey(key)) {
      // 如果是点击虚拟键盘的操控按键
      if (down) {
        // 如果是按下按键，则判断这个按键是否被加入到了按下的集合中
        if (this.virtualKeyboardPressedControlKeys.value.has(key)) {
          // 如果加入了，说明已经按过了，第二次按下则是需要发送抬起事件
          this.virtualKeyboardPressedControlKeys.value.delete(key)
          // keydownKeys.delete(key)
          this.sendHidEvent({ key, state: false }, enable)
          return
        } else {
          // 如果没有被加入，则说明是第一次按下，直接加入到集合中
          this.virtualKeyboardPressedControlKeys.value.add(key)
          // keydownKeys.add(key)
          this.sendHidEvent({ key, state: true }, enable)
          return
        }
      } else {
        // 如果是抬起按键，则不需要做任何处理，因为这几个控制键的抬起和按下消息的发送控制都是在按下的时候进行的
        return
      }
    } else {
      // 目前来说一定会走到这个条件语句
      this.sendHidEvent({ key, state: down }, enable)
      this.clearAllPressControlDownKeys()
      if (down) {
        this.keydownKeys.add(key)
      } else {
        if (browser.is_mac && [AllKeyboardKeys.MetaLeft, AllKeyboardKeys.MetaRight].includes(key)) {
          this.clearAllPressDownKeys()
        }
        this.keydownKeys.delete(key)
      }
    }
  }

  public clearAllPressDownKeys() {
    for (const key of this.keydownKeys) {
      this.sendEvent({ key, state: false })
    }
    this.clearAllPressControlDownKeys()
  }

  public clearAllPressControlDownKeys() {
    for (const key of this.virtualKeyboardPressedControlKeys.value) {
      if (KeyboardEventHandler.isControlKey(key)) {
        this.virtualKeyboardPressedControlKeys.value.delete(key)
        this.sendEvent({ key, state: false })
      }
    }
  }

  public isControlKeyDown(key: AllKeyboardKeys) {
    if (!KeyboardEventHandler.isControlKey(key)) {
      return false
    }
    return this.virtualKeyboardPressedControlKeys.value.has(key)
  }

  public sendShortcutKey(keys: AllKeyboardKeys[]) {
    const states = [true, false]
    states.forEach((state) => {
      for (let i = 0; i <= 1; i++) {
        keys.forEach((key) => {
          this.sendEvent({ key, state }, true)
        })
        i++
      }
    })
  }

  public sendHidEvent(event: { key: string; state: boolean }, enable: boolean = true) {
    if (enable) {
      this.sendEvent(event)
    }
  }

  private static downedKeys = new Set<string>()

  public sendEvent(event: { key: string; state: boolean }, forceSend?: boolean) {
    if (!this.keyboardEnabled && !forceSend) {
      return
    }
    if (event.state) {
      // 如果是按下按键，则记录
      if (!KeyboardEventHandler.downedKeys.has(event.key)) {
        KeyboardEventHandler.downedKeys.add(event.key)
      } else {
        return
      }
    } else {
      if (KeyboardEventHandler.downedKeys.has(event.key)) {
        KeyboardEventHandler.downedKeys.delete(event.key)
      }
    }
    // const msgStore = useMsgStore()
    sendHidEvent(this.apiWS, { event_type: 'key', event })
  }
}
