"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KvmStreamConnector = exports.WsEventType = exports.KvmDeviceModel = void 0;
var message_model_1 = require("./message.model");
var mouse_model_1 = require("./mouse.model");
var janus_model_1 = require("./janus.model");
var KvmDeviceModel;
(function (KvmDeviceModel) {
    KvmDeviceModel["RM1"] = "RM1";
    KvmDeviceModel["RM1PE"] = "RM1PE";
    KvmDeviceModel["RM10"] = "RM10";
})(KvmDeviceModel || (exports.KvmDeviceModel = KvmDeviceModel = {}));
var WsEventType;
(function (WsEventType) {
    WsEventType["PONG"] = "pong";
    // INFO_META_STATE = 'info_meta_state',
    // INFO_HW_STATE = 'info_hw_state',
    // INFO_FAN_STATE = 'info_fan_state',
    // INFO_SYSTEM_STATE = 'info_system_state',
    // INFO_EXTRAS_STATE = 'info_extras_state',
    // GPIO_MODEL_STATE = 'gpio_model_state',
    // GPIO_STATE = 'gpio_state',
    WsEventType["HID_KEYMAPS_STATE"] = "hid_keymaps";
    WsEventType["HID_STATE"] = "hid";
    WsEventType["ATX_STATE"] = "atx";
    WsEventType["MSD_STATE"] = "msd";
    WsEventType["STREAMER_STATE"] = "streamer";
    // STREAMER_OCR_STATE = 'streamer_ocr_state',
    // 新增
    WsEventType["FINGERBOT_STATE"] = "fingerbot";
    WsEventType["TURN_STATE"] = "turn";
})(WsEventType || (exports.WsEventType = WsEventType = {}));
var KvmStreamConnector = /** @class */ (function () {
    function KvmStreamConnector(kvm, videoElSelector, videoBoxElSelector) {
        this.kvm = kvm;
        this.videoElSelector = videoElSelector;
        this.videoBoxElSelector = videoBoxElSelector;
        this.videoEl = (0, janus_model_1.$)(this.videoElSelector);
        this.videoBox = (0, janus_model_1.$)(this.videoBoxElSelector);
        this.initApiWsSocket();
        // this.initMouseEvent();
    }
    KvmStreamConnector.prototype.initApiWsSocket = function () {
        var _this = this;
        (0, message_model_1.useWsMessage)(this.kvm, function (ws) { return _this.initMouseEvent(ws); });
    };
    KvmStreamConnector.prototype.initMouseEvent = function (ws) {
        this.mouseHandler = new mouse_model_1.MouseEventHandler(this.videoBox, this.videoElSelector, ws);
    };
    return KvmStreamConnector;
}());
exports.KvmStreamConnector = KvmStreamConnector;
