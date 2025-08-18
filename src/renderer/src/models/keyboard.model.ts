/* eslint-disable max-lines */
/*
 * @Author: shufei.han
 * @Date: 2024-11-25 10:49:45
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-06-05 14:11:35
 * @FilePath: \gl-kvm-frontend\src\models\keyboard.model.ts
 * @Description: 键盘控制
 */
import type { HidEventState } from './state.model'
import { SelectOptions } from '@gl/main'
import { browser } from '@renderer/tools'

export type KeyboardKeyPosition = 'left' | 'right' | 'center'
/** 键盘所有的按键 */
export enum AllKeyboardKeys {
  Escape = 'Escape',
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',
  Backquote = 'Backquote',
  Digit1 = 'Digit1',
  Digit2 = 'Digit2',
  Digit3 = 'Digit3',
  Digit4 = 'Digit4',
  Digit5 = 'Digit5',
  Digit6 = 'Digit6',
  Digit7 = 'Digit7',
  Digit8 = 'Digit8',
  Digit9 = 'Digit9',
  Digit0 = 'Digit0',
  Minus = 'Minus',
  Equal = 'Equal',
  Backspace = 'Backspace',
  Tab = 'Tab',
  KeyQ = 'KeyQ',
  KeyW = 'KeyW',
  KeyE = 'KeyE',
  KeyR = 'KeyR',
  KeyT = 'KeyT',
  KeyY = 'KeyY',
  KeyU = 'KeyU',
  KeyI = 'KeyI',
  KeyO = 'KeyO',
  KeyP = 'KeyP',
  BracketLeft = 'BracketLeft',
  BracketRight = 'BracketRight',
  Backslash = 'Backslash',
  CapsLock = 'CapsLock',
  KeyA = 'KeyA',
  KeyS = 'KeyS',
  KeyD = 'KeyD',
  KeyF = 'KeyF',
  KeyG = 'KeyG',
  KeyH = 'KeyH',
  KeyJ = 'KeyJ',
  KeyK = 'KeyK',
  KeyL = 'KeyL',
  Semicolon = 'Semicolon',
  Quote = 'Quote',
  Enter = 'Enter',
  KeyZ = 'KeyZ',
  KeyX = 'KeyX',
  KeyC = 'KeyC',
  KeyV = 'KeyV',
  KeyB = 'KeyB',
  KeyN = 'KeyN',
  KeyM = 'KeyM',
  Comma = 'Comma',
  Period = 'Period',
  Slash = 'Slash',
  Space = 'Space',
  ContextMenu = 'ContextMenu',
  ScrollLock = 'ScrollLock',
  Pause = 'Pause',
  Insert = 'Insert',
  Home = 'Home',
  PageUp = 'PageUp',
  Delete = 'Delete',
  End = 'End',
  PageDown = 'PageDown',
  ArrowUp = 'ArrowUp',
  ArrowLeft = 'ArrowLeft',
  ArrowDown = 'ArrowDown',
  ArrowRight = 'ArrowRight',
  Power = 'Power',
  NumLock = 'NumLock',
  NumpadDivide = 'NumpadDivide',
  NumpadMultiply = 'NumpadMultiply',
  NumpadSubtract = 'NumpadSubtract',
  Numpad7 = 'Numpad7',
  Numpad8 = 'Numpad8',
  Numpad9 = 'Numpad9',
  Numpad4 = 'Numpad4',
  Numpad5 = 'Numpad5',
  Numpad6 = 'Numpad6',
  NumpadAdd = 'NumpadAdd',
  Numpad1 = 'Numpad1',
  Numpad2 = 'Numpad2',
  Numpad3 = 'Numpad3',
  Numpad0 = 'Numpad0',
  NumpadDecimal = 'NumpadDecimal',
  NumpadEnter = 'NumpadEnter',
  ShiftLeft = 'ShiftLeft',
  ShiftRight = 'ShiftRight',
  ControlLeft = 'ControlLeft',
  MetaLeft = 'MetaLeft',
  MetaRight = 'MetaRight',
  AltLeft = 'AltLeft',
  AltRight = 'AltRight',
  Win = 'Win',
  ControlRight = 'ControlRight',
  PrintScreen = 'PrintScreen'
}
/** 虚拟键盘按键 */
export interface KeyboardKeyType {
  code?: AllKeyboardKeys
  title?: string
  subtitle?: string
  width?: number
  lockStatus?: boolean
  withLock?: boolean
  withDot?: boolean
  ledPosition?: KeyboardKeyPosition
  titlePosition?: KeyboardKeyPosition
  subtitlePosition?: KeyboardKeyPosition
  isGutter?: boolean
  shrink?: number
  shortcutTitle?: [string, string]
}

export type KeyboardItemType = KeyboardKeyType & { isGutter?: boolean }

/** 键盘按键 */
export class KeyboardKey implements KeyboardKeyType {
  constructor(
    public code: AllKeyboardKeys,
    public title: string,
    public subtitle?: string,
    public width: number = 32,
    public lockStatus?: boolean,
    public withLock?: boolean,
    public withDot?: boolean,
    public ledPosition: KeyboardKeyPosition = 'center',
    public titlePosition: KeyboardKeyPosition = 'center',
    public subtitlePosition?: KeyboardKeyPosition,
    public isGutter = false,
    public shrink = 1
  ) {}
}

export class KeyboardKeyWithCustomShrink extends KeyboardKey {
  constructor(
    public code: AllKeyboardKeys,
    public title: string,
    public subtitle?: string,
    public shrink = 1,
    public titlePosition: KeyboardKeyPosition = 'left',
    public lockStatus?: boolean,
    public withLock?: boolean,
    public withDot?: boolean,
    public ledPosition: KeyboardKeyPosition = 'left',
    public subtitlePosition?: KeyboardKeyPosition,
    public isGutter = false
  ) {
    super(
      code,
      title,
      subtitle,
      undefined,
      lockStatus,
      withLock,
      withDot,
      ledPosition,
      titlePosition,
      subtitlePosition,
      isGutter
    )
  }
}

export class KeyboardKeyWithShortCut extends KeyboardKey implements KeyboardKeyType {
  constructor(
    public code: AllKeyboardKeys,
    public title: string,
    public shortcutTitle?: [string, string],
    public subtitle?: string,
    public width: number = 32,
    public lockStatus?: boolean,
    public withLock?: boolean,
    public withDot?: boolean,
    public ledPosition: KeyboardKeyPosition = 'left',
    public titlePosition: KeyboardKeyPosition = 'left',
    public subtitlePosition?: KeyboardKeyPosition,
    public isGutter = false,
    public shrink = 1
  ) {
    super(
      code,
      title,
      subtitle,
      width,
      lockStatus,
      withLock,
      withDot,
      ledPosition,
      titlePosition,
      subtitlePosition,
      isGutter
    )
  }
}

/** 键盘按键带小圆点 */
export class KeyboardKeyWithDot extends KeyboardKey {
  constructor(
    public code: AllKeyboardKeys,
    public title: string,
    public subtitle?: string,
    public width: number = 32,
    public ledPosition: KeyboardKeyPosition = 'left',
    public titlePosition: KeyboardKeyPosition = 'left',
    public subtitlePosition?: KeyboardKeyPosition,
    public lockStatus?: boolean,
    public withLock?: boolean,
    public isGutter = false,
    public shrink = 1
  ) {
    super(
      code,
      title,
      subtitle,
      width,
      lockStatus,
      withLock,
      true,
      ledPosition,
      titlePosition,
      subtitlePosition,
      isGutter
    )
  }
}

// 占位（占一整个按键的宽度的这种）
const KeyGutter = { isGutter: true, width: 32, shrink: 1 }
// 小占位（esc和f1之间这种）
const TinyKeyGutter = { isGutter: true, width: 24, shrink: 0.5 }
/** 前端展示的键盘布局的数据类型抽象 */
export interface KeyboardKeyLayout {
  left: KeyboardItemType[][]
  center?: KeyboardItemType[][]
  right?: KeyboardItemType[][]
  bottom?: KeyboardItemType[][]
  bottomRight?: KeyboardItemType[][]
}
/** 虚拟键盘的按键以及布局 */
export const genKeyboardKeyList = (
  config?: HidEventState['keyboard']['leds']
): KeyboardKeyLayout => {
  return {
    left: [
      [
        new KeyboardKey(
          AllKeyboardKeys.Escape,
          'Esc',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'left'
        ),
        TinyKeyGutter,
        new KeyboardKey(AllKeyboardKeys.F1, 'F1'),
        new KeyboardKey(AllKeyboardKeys.F2, 'F2'),
        new KeyboardKey(AllKeyboardKeys.F3, 'F3'),
        new KeyboardKey(AllKeyboardKeys.F4, 'F4'),
        TinyKeyGutter,
        new KeyboardKey(AllKeyboardKeys.F5, 'F5'),
        new KeyboardKey(AllKeyboardKeys.F6, 'F6'),
        new KeyboardKey(AllKeyboardKeys.F7, 'F7'),
        new KeyboardKey(AllKeyboardKeys.F8, 'F8'),
        TinyKeyGutter,
        new KeyboardKey(AllKeyboardKeys.F9, 'F9'),
        new KeyboardKey(AllKeyboardKeys.F10, 'F10'),
        new KeyboardKey(AllKeyboardKeys.F11, 'F11'),
        new KeyboardKey(AllKeyboardKeys.F12, 'F12')
      ],
      [
        new KeyboardKey(AllKeyboardKeys.Backquote, '~', '`'),
        new KeyboardKey(AllKeyboardKeys.Digit1, '!', '1'),
        new KeyboardKey(AllKeyboardKeys.Digit2, '@', '2'),
        new KeyboardKey(AllKeyboardKeys.Digit3, '#', '3'),
        new KeyboardKey(AllKeyboardKeys.Digit4, '$', '4'),
        new KeyboardKey(AllKeyboardKeys.Digit5, '%', '5'),
        new KeyboardKey(AllKeyboardKeys.Digit6, '^', '6'),
        new KeyboardKey(AllKeyboardKeys.Digit7, '&', '7'),
        new KeyboardKey(AllKeyboardKeys.Digit8, '*', '8'),
        new KeyboardKey(AllKeyboardKeys.Digit9, '(', '9'),
        new KeyboardKey(AllKeyboardKeys.Digit0, ')', '0'),
        new KeyboardKey(AllKeyboardKeys.Minus, '_', '-'),
        new KeyboardKey(AllKeyboardKeys.Equal, '+', '='),
        new KeyboardKeyWithCustomShrink(
          AllKeyboardKeys.Backspace,
          'Backspace',
          undefined,
          1.5,
          'right'
        )
      ],
      [
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.Tab, 'Tab', '', 1.5),
        new KeyboardKey(AllKeyboardKeys.KeyQ, 'Q'),
        new KeyboardKey(AllKeyboardKeys.KeyW, 'W'),
        new KeyboardKey(AllKeyboardKeys.KeyE, 'E'),
        new KeyboardKey(AllKeyboardKeys.KeyR, 'R'),
        new KeyboardKey(AllKeyboardKeys.KeyT, 'T'),
        new KeyboardKey(AllKeyboardKeys.KeyY, 'Y'),
        new KeyboardKey(AllKeyboardKeys.KeyU, 'U'),
        new KeyboardKey(AllKeyboardKeys.KeyI, 'I'),
        new KeyboardKey(AllKeyboardKeys.KeyO, 'O'),
        new KeyboardKey(AllKeyboardKeys.KeyP, 'P'),
        new KeyboardKey(AllKeyboardKeys.BracketLeft, '{', '['),
        new KeyboardKey(AllKeyboardKeys.BracketRight, '}', ']'),
        new KeyboardKey(AllKeyboardKeys.Backslash, '|', '\\')
      ],
      [
        new KeyboardKeyWithCustomShrink(
          AllKeyboardKeys.CapsLock,
          'Caps',
          undefined,
          1.75,
          'left',
          config?.caps,
          true,
          undefined,
          'right'
        ),
        new KeyboardKey(AllKeyboardKeys.KeyA, 'A'),
        new KeyboardKey(AllKeyboardKeys.KeyS, 'S'),
        new KeyboardKey(AllKeyboardKeys.KeyD, 'D'),
        new KeyboardKey(AllKeyboardKeys.KeyF, 'F'),
        new KeyboardKey(AllKeyboardKeys.KeyG, 'G'),
        new KeyboardKey(AllKeyboardKeys.KeyH, 'H'),
        new KeyboardKey(AllKeyboardKeys.KeyJ, 'J'),
        new KeyboardKey(AllKeyboardKeys.KeyK, 'K'),
        new KeyboardKey(AllKeyboardKeys.KeyL, 'L'),
        new KeyboardKey(AllKeyboardKeys.Semicolon, ':', ';'),
        new KeyboardKey(AllKeyboardKeys.Quote, '"', "'"),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.Enter, 'Enter', undefined, 1.75, 'right')
      ],
      [
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.ShiftLeft, 'Shift', undefined, 2),
        new KeyboardKey(AllKeyboardKeys.KeyZ, 'Z'),
        new KeyboardKey(AllKeyboardKeys.KeyX, 'X'),
        new KeyboardKey(AllKeyboardKeys.KeyC, 'C'),
        new KeyboardKey(AllKeyboardKeys.KeyV, 'V'),
        new KeyboardKey(AllKeyboardKeys.KeyB, 'B'),
        new KeyboardKey(AllKeyboardKeys.KeyN, 'N'),
        new KeyboardKey(AllKeyboardKeys.KeyM, 'M'),
        new KeyboardKey(AllKeyboardKeys.Comma, ',', '<'),
        new KeyboardKey(AllKeyboardKeys.Period, '.', '>'),
        new KeyboardKey(AllKeyboardKeys.Slash, '/', '?'),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.ShiftRight, 'Shift', undefined, 2, 'right')
      ],
      [
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.ControlLeft, 'Ctrl', undefined, 1.5),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.MetaLeft, 'Win', undefined, 1.5),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.AltLeft, 'Alt', undefined, 1.5),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.Space, 'Space', undefined, 4.4, 'center'),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.AltRight, 'Alt', undefined, 1.5, 'right'),
        new KeyboardKeyWithCustomShrink(AllKeyboardKeys.Win, 'Win', undefined, 1.5, 'right'),
        new KeyboardKeyWithCustomShrink(
          AllKeyboardKeys.ContextMenu,
          'Menu',
          undefined,
          1.5,
          'right'
        ),
        new KeyboardKeyWithCustomShrink(
          AllKeyboardKeys.ControlRight,
          'Ctrl',
          undefined,
          1.5,
          'right'
        )
      ]
    ],
    right: [
      [
        new KeyboardKey(AllKeyboardKeys.PrintScreen, 'Pt/Sq'),
        new KeyboardKey(
          AllKeyboardKeys.ScrollLock,
          'ScrLk',
          undefined,
          undefined,
          config?.scroll,
          true
        ),
        new KeyboardKey(AllKeyboardKeys.Pause, 'Pause')
      ],
      [
        new KeyboardKey(AllKeyboardKeys.Insert, 'Ins'),
        new KeyboardKey(AllKeyboardKeys.Home, 'Home'),
        new KeyboardKey(AllKeyboardKeys.PageUp, 'PgUp')
      ],
      [
        new KeyboardKey(AllKeyboardKeys.Delete, 'Del'),
        new KeyboardKey(AllKeyboardKeys.End, 'End'),
        new KeyboardKey(AllKeyboardKeys.PageDown, 'PgDn')
      ],
      [KeyGutter, KeyGutter, KeyGutter],
      [KeyGutter, new KeyboardKey(AllKeyboardKeys.ArrowUp, '↑'), KeyGutter],
      [
        new KeyboardKey(AllKeyboardKeys.ArrowLeft, '←'),
        new KeyboardKey(AllKeyboardKeys.ArrowDown, '↓'),
        new KeyboardKey(AllKeyboardKeys.ArrowRight, '→')
      ]
    ],
    bottom: [
      [
        new KeyboardKeyWithShortCut(AllKeyboardKeys.PrintScreen, 'Pt/Sq', ['Pt/', 'Sq']),
        new KeyboardKeyWithShortCut(
          AllKeyboardKeys.ScrollLock,
          'ScrLk',
          ['Scr', 'Lk'],
          undefined,
          undefined,
          config?.scroll,
          true
        ),
        new KeyboardKeyWithShortCut(AllKeyboardKeys.Pause, 'Pause', ['Pau', 'se']),
        new KeyboardKeyWithShortCut(AllKeyboardKeys.Insert, 'Ins'),
        new KeyboardKeyWithShortCut(AllKeyboardKeys.Home, 'Home', ['Ho', 'me']),
        new KeyboardKeyWithShortCut(AllKeyboardKeys.PageUp, 'PgUp', ['Pg', 'Up']),
        new KeyboardKeyWithShortCut(AllKeyboardKeys.PageDown, 'PgDn', ['Pg', 'Dn']),
        new KeyboardKey(AllKeyboardKeys.Delete, 'Del'),
        new KeyboardKey(AllKeyboardKeys.End, 'End')
      ]
    ],
    bottomRight: [
      [KeyGutter, new KeyboardKey(AllKeyboardKeys.ArrowUp, '↑'), KeyGutter],
      [
        new KeyboardKey(AllKeyboardKeys.ArrowLeft, '←'),
        new KeyboardKey(AllKeyboardKeys.ArrowDown, '↓'),
        new KeyboardKey(AllKeyboardKeys.ArrowRight, '→')
      ]
    ]
  }
}
/** 虚拟键盘状态 */
export enum VIRTUAL_KEYBOARD_STATUS {
  /** 浮动 */
  FLOAT,
  /** 固定 */
  FIXED,
  /** 关闭 */
  CLOSED
}

/** 初始化虚拟键盘的位置 */
export const initVirtualKeyboardPosition = (el: HTMLDivElement) => {
  const { clientWidth, clientHeight } = el
  return {
    x: window.innerWidth / 2 - clientWidth / 2,
    y: window.innerHeight / 2 - clientHeight / 2
  }
}
/** 键盘快捷键 */
export enum KeyShortcuts {
  CTRL_ALT_DEL,
  ALT_SHIFT,
  ALT_TAB,
  ALT_F4,
  CTROL_W,
  WIN_P,
  // more
  MORE
}
/** 最多只支持添加30个快捷键 */
export const MAX_SHORTCUT_LENGTH = 30
/** 虚拟键盘支持固定的最小高度（小于这个高度就只能浮动） */
export const MIN_VK_FIXED_HEIGHT = 600
/** 键盘按键快捷方式的数据类型 */
export interface KeyShortcutsInfo {
  keys: AllKeyboardKeys[]
  label: string
}

const { ControlLeft, AltLeft, MetaLeft, KeyP, ShiftLeft, F4, Tab, Delete, KeyW } = AllKeyboardKeys
/** 快捷键配置 */
export const KeyboardShortcutConfigMap = new Map<KeyShortcuts, KeyShortcutsInfo>([
  [KeyShortcuts.CTRL_ALT_DEL, { keys: [ControlLeft, AltLeft, Delete], label: 'Ctrl + Alt + Del' }],
  [KeyShortcuts.WIN_P, { keys: [MetaLeft, KeyP], label: 'Win + P' }],
  [KeyShortcuts.ALT_SHIFT, { keys: [AltLeft, ShiftLeft], label: 'Alt + Shift' }],
  [KeyShortcuts.CTROL_W, { keys: [ControlLeft, KeyW], label: 'Ctrl + W' }],
  [KeyShortcuts.ALT_TAB, { keys: [AltLeft, Tab], label: 'Alt + Tab' }],
  [KeyShortcuts.ALT_F4, { keys: [AltLeft, F4], label: 'Alt + F4' }]
  /** 特殊处理more */
  // [KeyShortcuts.MORE, {keys: [], label: 'common.more'}],
])
/** 快捷键选项 */
export const shortcutKeyOptions: SelectOptions<KeyShortcuts>[] = [
  KeyShortcuts.CTRL_ALT_DEL,
  KeyShortcuts.ALT_SHIFT,
  KeyShortcuts.ALT_TAB,
  KeyShortcuts.ALT_F4,
  KeyShortcuts.WIN_P,
  KeyShortcuts.CTROL_W
  // KeyShortcuts.MORE,
].map((item) => new SelectOptions(item, KeyboardShortcutConfigMap.get(item).label))
/** 内置的、默认的键盘快捷键 */
export const DEFAULT_KEY_SHORTCUTS: KeyShortcutsInfo[] = shortcutKeyOptions.map((item) =>
  KeyboardShortcutConfigMap.get(item.value)
)
/** 键盘键值对应的名称标签（这些是表现出来的和虚拟键盘展示不一样的，然后下面再去从虚拟键盘中摘取剩下的） */
const KeyboardLabelMap = new Map<AllKeyboardKeys, string>([
  [AllKeyboardKeys.ControlLeft, 'Ctrl-L'],
  [AllKeyboardKeys.AltLeft, 'Alt-L'],
  [AllKeyboardKeys.MetaLeft, 'Windows'],
  [AllKeyboardKeys.ShiftLeft, 'Shift-L'],
  [AllKeyboardKeys.AltRight, 'Alt-R'],
  [AllKeyboardKeys.ControlRight, 'Ctrl-R'],
  [AllKeyboardKeys.ShiftRight, 'Shift-R'],
  [AllKeyboardKeys.CapsLock, 'Caps Lock'],
  [AllKeyboardKeys.NumpadMultiply, '*'],
  [AllKeyboardKeys.Backspace, 'Backspace']
])
// @ts-ignore
Object.values(genKeyboardKeyList())
  .flat()
  .flat()
  .forEach((item: KeyboardItemType) => {
    if (item.isGutter) {
      return
    }
    if (!KeyboardLabelMap.has(item.code)) {
      KeyboardLabelMap.set(item.code, item.title)
    }
  })
/** 解析按键对应的快捷键的label */
export const parseKeyboardSingleKeyLabel = (key: AllKeyboardKeys) => {
  if (!key) {
    return ''
  }
  if (browser.is_mac) {
    switch (key) {
      case AllKeyboardKeys.MetaLeft:
        return '⌘-L'
      case AllKeyboardKeys.MetaRight:
        return '⌘-R'
      case AllKeyboardKeys.AltLeft:
        return 'Option-L'
      case AllKeyboardKeys.AltRight:
        return 'Option-R'
    }
  }
  if (key.startsWith('Key')) {
    return key.replace('Key', '')
  }
  if (key.startsWith('Digit')) {
    return key.replace('Digit', '')
  }
  return KeyboardLabelMap.get(key) || key
}

export function parseKeyboardShortcutsLabel(shortcut: KeyShortcutsInfo) {
  return shortcut.keys.map((item) => parseKeyboardSingleKeyLabel(item)).join(' + ')
}

// window.a = Object.values(AllKeyboardKeys).map(code => ({
//     code,
//     title: KeyboardLabelMap.get(code),
//     label: parseKeyboardSingleKeyLabel(code),
// }))
