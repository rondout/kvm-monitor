import { SelectOptions } from '@gl/main'

export enum HidStatus {
  FREE,
  FREE_HID_OFFLINE,
  FREE_INACTIVE,
  CAPTURED_HID_OFFLINE,
  CAPTURED_ACTIVE,
  CAPTURED_INACTIVE,
  NOT_ENABLED
}

export const HidStatusMap = new Map([
  [
    HidStatus.FREE,
    {
      mouseTitle: 'main.mouseFree',
      keyboardTitle: 'main.keyboardFree',
      color: 'var(--gl-color-text-level2)'
    }
  ],
  [
    HidStatus.FREE_INACTIVE,
    {
      mouseTitle: 'main.mouseFreeHidInactive',
      keyboardTitle: 'main.keyboardFreeHidInactive',
      color: 'var(--gl-color-warning-primary)'
    }
  ],
  [
    HidStatus.FREE_HID_OFFLINE,
    {
      mouseTitle: 'main.mouseFreeHidOffline',
      keyboardTitle: 'main.keyboardFreeHidOffline',
      color: 'var(--gl-color-error-primary)'
    }
  ],
  [
    HidStatus.CAPTURED_HID_OFFLINE,
    {
      mouseTitle: 'main.mouseCapturedHidOffline',
      keyboardTitle: 'main.keyboardCapturedHidOffline',
      color: 'var(--gl-color-error-primary)'
    }
  ],
  [
    HidStatus.CAPTURED_ACTIVE,
    {
      mouseTitle: 'main.mouseCapturedActive',
      keyboardTitle: 'main.keyboardCapturedActive',
      color: 'var(--gl-color-brand-primary)'
    }
  ],
  [
    HidStatus.CAPTURED_INACTIVE,
    {
      mouseTitle: 'main.mouseCapturedInactive',
      keyboardTitle: 'main.keyboardCapturedInactive',
      color: 'var(--gl-color-warning-primary)'
    }
  ],
  [
    HidStatus.NOT_ENABLED,
    {
      mouseTitle: 'main.mouseNotEnabled',
      keyboardTitle: 'main.keyboardNotEnabled',
      color: 'var(--gl-color-text-disabledd)'
    }
  ]
])
/** 解析HID状态 */
export function parseHidStatus(
  mouseOrKeyboardOnline: boolean,
  hidOnline: boolean,
  hidBusy: boolean,
  captured: boolean,
  enabled
) {
  if (!enabled) {
    return HidStatusMap.get(HidStatus.NOT_ENABLED)
  }
  let online = true
  if (!hidOnline) {
    online = null
  } else {
    online = mouseOrKeyboardOnline && !hidBusy
  }

  let status = HidStatus.FREE

  if (online === null) {
    status = captured ? HidStatus.CAPTURED_HID_OFFLINE : HidStatus.FREE_HID_OFFLINE
  } else if (online) {
    if (captured) {
      status = HidStatus.CAPTURED_ACTIVE
    }
  } else {
    status = captured ? HidStatus.CAPTURED_INACTIVE : HidStatus.FREE_INACTIVE
  }

  return HidStatusMap.get(status)
}
/** 默认鼠标轮询间隔 */
export const DEFAULT_MOUSE_POLLING = 10
/** 鼠标移动速度倍率 默认1.0 */
export const DEFAULT_RELATIVE_SENSE = 10
/** 鼠标滚轮速度倍率 默认5.0 */
export const DEFAULT_SCROLL_RATE = 5
/** 鼠标滚动翻转 */
export enum ReverseScrolling {
  /** 翻转水平方向 */
  HORIZONTAL = 'HORIZONTAL',
  /** 翻转垂直方向 */
  VERTICAL = 'VERTICAL',
  /** 翻转水平+垂直方向 */
  BOTH = 'BOTH',
  /** 不翻转 */
  STANDARD = 'STANDARD'
}

export const reverseScrollingOptions = [
  new SelectOptions(ReverseScrolling.STANDARD, 'settings.standard'),
  new SelectOptions(ReverseScrolling.VERTICAL, 'settings.vertical'),
  new SelectOptions(ReverseScrolling.HORIZONTAL, 'settings.horizontal'),
  new SelectOptions(ReverseScrolling.BOTH, 'settings.bothScroll')
]

export enum MouseMode {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative'
}

export const MouseModeOptions = [
  new SelectOptions(MouseMode.ABSOLUTE, 'settings.absolute'),
  new SelectOptions(MouseMode.RELATIVE, 'settings.relative')
]

export enum Keymaps {
  AR = 'ar',
  BEPO = 'bepo',
  CZ = 'cz',
  DA = 'da',
  DE = 'de',
  DE_CH = 'de-ch',
  EN_GB = 'en-gb',
  EN_US = 'en-us',
  EN_US_ALTGR_INTL = 'en-us-altgr-intl',
  ES = 'es',
  ET = 'et',
  FI = 'fi',
  FO = 'fo',
  FR = 'fr',
  FR_BE = 'fr-be',
  FR_CA = 'fr-ca',
  FR_CH = 'fr-ch',
  HR = 'hr',
  HU = 'hu',
  IS = 'is',
  IT = 'it',
  JA = 'ja',
  LT = 'lt',
  LV = 'lv',
  MK = 'mk',
  NL = 'nl',
  NO = 'no',
  PL = 'pl',
  PT = 'pt',
  PT_BR = 'pt-br',
  RU = 'ru',
  SL = 'sl',
  SV = 'sv',
  TH = 'th',
  TR = 'tr'
}

export const keymapLabelMap = new Map([
  [Keymaps.AR, 'keymaps.ar'],
  [Keymaps.BEPO, 'keymaps.bepo'],
  [Keymaps.CZ, 'keymaps.cz'],
  [Keymaps.DA, 'keymaps.da'],
  [Keymaps.DE, 'keymaps.de'],
  [Keymaps.DE_CH, 'keymaps.de_ch'],
  [Keymaps.EN_GB, 'keymaps.en_gb'],
  [Keymaps.EN_US, 'keymaps.en_us'],
  [Keymaps.EN_US_ALTGR_INTL, 'keymaps.en_us_altgr_intl'],
  [Keymaps.ES, 'keymaps.es'],
  [Keymaps.ET, 'keymaps.et'],
  [Keymaps.FI, 'keymaps.fi'],
  [Keymaps.FO, 'keymaps.fo'],
  [Keymaps.FR, 'keymaps.fr'],
  [Keymaps.FR_BE, 'keymaps.fr_be'],
  [Keymaps.FR_CA, 'keymaps.fr_ca'],
  [Keymaps.FR_CH, 'keymaps.fr_ch'],
  [Keymaps.HR, 'keymaps.hr'],
  [Keymaps.HU, 'keymaps.hu'],
  [Keymaps.IS, 'keymaps.is'],
  [Keymaps.IT, 'keymaps.it'],
  [Keymaps.JA, 'keymaps.ja'],
  [Keymaps.LT, 'keymaps.lt'],
  [Keymaps.LV, 'keymaps.lv'],
  [Keymaps.MK, 'keymaps.mk'],
  [Keymaps.NL, 'keymaps.nl'],
  [Keymaps.NO, 'keymaps.no'],
  [Keymaps.PL, 'keymaps.pl'],
  [Keymaps.PT, 'keymaps.pt'],
  [Keymaps.PT_BR, 'keymaps.pt_br'],
  [Keymaps.RU, 'keymaps.ru'],
  [Keymaps.SL, 'keymaps.sl'],
  [Keymaps.SV, 'keymaps.sv'],
  [Keymaps.TH, 'keymaps.th'],
  [Keymaps.TR, 'keymaps.tr']
])

export const keymapSelections = Object.entries(Keymaps).map(
  ([, value]) => new SelectOptions(value, keymapLabelMap.get(value))
)

export interface HidParams {
  mouse_output: 'usb' | 'usb_rel'
  jiggler: boolean
}
