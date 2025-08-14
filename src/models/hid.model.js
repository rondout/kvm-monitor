"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keymapSelections = exports.keymapLabelMap = exports.Keymaps = exports.MouseModeOptions = exports.MouseMode = exports.reverseScrollingOptions = exports.ReverseScrolling = exports.DEFAULT_SCROLL_RATE = exports.DEFAULT_RELATIVE_SENSE = exports.DEFAULT_MOUSE_POLLING = exports.HidStatusMap = exports.HidStatus = void 0;
exports.parseHidStatus = parseHidStatus;
var main_1 = require("@gl/main");
var HidStatus;
(function (HidStatus) {
    HidStatus[HidStatus["FREE"] = 0] = "FREE";
    HidStatus[HidStatus["FREE_HID_OFFLINE"] = 1] = "FREE_HID_OFFLINE";
    HidStatus[HidStatus["FREE_INACTIVE"] = 2] = "FREE_INACTIVE";
    HidStatus[HidStatus["CAPTURED_HID_OFFLINE"] = 3] = "CAPTURED_HID_OFFLINE";
    HidStatus[HidStatus["CAPTURED_ACTIVE"] = 4] = "CAPTURED_ACTIVE";
    HidStatus[HidStatus["CAPTURED_INACTIVE"] = 5] = "CAPTURED_INACTIVE";
    HidStatus[HidStatus["NOT_ENABLED"] = 6] = "NOT_ENABLED";
})(HidStatus || (exports.HidStatus = HidStatus = {}));
exports.HidStatusMap = new Map([
    [HidStatus.FREE,
        { mouseTitle: 'main.mouseFree', keyboardTitle: 'main.keyboardFree', color: 'var(--gl-color-text-level2)' }],
    [HidStatus.FREE_INACTIVE,
        { mouseTitle: 'main.mouseFreeHidInactive', keyboardTitle: 'main.keyboardFreeHidInactive', color: 'var(--gl-color-warning-primary)' }],
    [HidStatus.FREE_HID_OFFLINE,
        { mouseTitle: 'main.mouseFreeHidOffline', keyboardTitle: 'main.keyboardFreeHidOffline', color: 'var(--gl-color-error-primary)' }],
    [HidStatus.CAPTURED_HID_OFFLINE,
        { mouseTitle: 'main.mouseCapturedHidOffline', keyboardTitle: 'main.keyboardCapturedHidOffline', color: 'var(--gl-color-error-primary)' }],
    [HidStatus.CAPTURED_ACTIVE,
        { mouseTitle: 'main.mouseCapturedActive', keyboardTitle: 'main.keyboardCapturedActive', color: 'var(--gl-color-brand-primary)' }],
    [HidStatus.CAPTURED_INACTIVE,
        { mouseTitle: 'main.mouseCapturedInactive', keyboardTitle: 'main.keyboardCapturedInactive', color: 'var(--gl-color-warning-primary)' }],
    [HidStatus.NOT_ENABLED,
        { mouseTitle: 'main.mouseNotEnabled', keyboardTitle: 'main.keyboardNotEnabled', color: 'var(--gl-color-text-disabledd)' }],
]);
/** 解析HID状态 */
function parseHidStatus(mouseOrKeyboardOnline, hidOnline, hidBusy, captured, enabled) {
    if (!enabled) {
        return exports.HidStatusMap.get(HidStatus.NOT_ENABLED);
    }
    var online = true;
    if (!hidOnline) {
        online = null;
    }
    else {
        online = mouseOrKeyboardOnline && !hidBusy;
    }
    var status = HidStatus.FREE;
    if (online === null) {
        status = captured ? HidStatus.CAPTURED_HID_OFFLINE : HidStatus.FREE_HID_OFFLINE;
    }
    else if (online) {
        if (captured) {
            status = HidStatus.CAPTURED_ACTIVE;
        }
    }
    else {
        status = captured ? HidStatus.CAPTURED_INACTIVE : HidStatus.FREE_INACTIVE;
    }
    return exports.HidStatusMap.get(status);
}
/** 默认鼠标轮询间隔 */
exports.DEFAULT_MOUSE_POLLING = 10;
/** 鼠标移动速度倍率 默认1.0 */
exports.DEFAULT_RELATIVE_SENSE = 10;
/** 鼠标滚轮速度倍率 默认5.0 */
exports.DEFAULT_SCROLL_RATE = 5;
/** 鼠标滚动翻转 */
var ReverseScrolling;
(function (ReverseScrolling) {
    /** 翻转水平方向 */
    ReverseScrolling["HORIZONTAL"] = "HORIZONTAL";
    /** 翻转垂直方向 */
    ReverseScrolling["VERTICAL"] = "VERTICAL";
    /** 翻转水平+垂直方向 */
    ReverseScrolling["BOTH"] = "BOTH";
    /** 不翻转 */
    ReverseScrolling["STANDARD"] = "STANDARD";
})(ReverseScrolling || (exports.ReverseScrolling = ReverseScrolling = {}));
exports.reverseScrollingOptions = [
    new main_1.SelectOptions(ReverseScrolling.STANDARD, 'settings.standard'),
    new main_1.SelectOptions(ReverseScrolling.VERTICAL, 'settings.vertical'),
    new main_1.SelectOptions(ReverseScrolling.HORIZONTAL, 'settings.horizontal'),
    new main_1.SelectOptions(ReverseScrolling.BOTH, 'settings.bothScroll'),
];
var MouseMode;
(function (MouseMode) {
    MouseMode["ABSOLUTE"] = "absolute";
    MouseMode["RELATIVE"] = "relative";
})(MouseMode || (exports.MouseMode = MouseMode = {}));
exports.MouseModeOptions = [
    new main_1.SelectOptions(MouseMode.ABSOLUTE, 'settings.absolute'),
    new main_1.SelectOptions(MouseMode.RELATIVE, 'settings.relative'),
];
var Keymaps;
(function (Keymaps) {
    Keymaps["AR"] = "ar";
    Keymaps["BEPO"] = "bepo";
    Keymaps["CZ"] = "cz";
    Keymaps["DA"] = "da";
    Keymaps["DE"] = "de";
    Keymaps["DE_CH"] = "de-ch";
    Keymaps["EN_GB"] = "en-gb";
    Keymaps["EN_US"] = "en-us";
    Keymaps["EN_US_ALTGR_INTL"] = "en-us-altgr-intl";
    Keymaps["ES"] = "es";
    Keymaps["ET"] = "et";
    Keymaps["FI"] = "fi";
    Keymaps["FO"] = "fo";
    Keymaps["FR"] = "fr";
    Keymaps["FR_BE"] = "fr-be";
    Keymaps["FR_CA"] = "fr-ca";
    Keymaps["FR_CH"] = "fr-ch";
    Keymaps["HR"] = "hr";
    Keymaps["HU"] = "hu";
    Keymaps["IS"] = "is";
    Keymaps["IT"] = "it";
    Keymaps["JA"] = "ja";
    Keymaps["LT"] = "lt";
    Keymaps["LV"] = "lv";
    Keymaps["MK"] = "mk";
    Keymaps["NL"] = "nl";
    Keymaps["NO"] = "no";
    Keymaps["PL"] = "pl";
    Keymaps["PT"] = "pt";
    Keymaps["PT_BR"] = "pt-br";
    Keymaps["RU"] = "ru";
    Keymaps["SL"] = "sl";
    Keymaps["SV"] = "sv";
    Keymaps["TH"] = "th";
    Keymaps["TR"] = "tr";
})(Keymaps || (exports.Keymaps = Keymaps = {}));
exports.keymapLabelMap = new Map([
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
    [Keymaps.TR, 'keymaps.tr'],
]);
exports.keymapSelections = Object.entries(Keymaps).map(function (_a) {
    var value = _a[1];
    return new main_1.SelectOptions(value, exports.keymapLabelMap.get(value));
});
