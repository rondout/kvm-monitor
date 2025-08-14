"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWsMessage = void 0;
var kvm_model_1 = require("./kvm.model");
var vue_1 = require("vue");
var state_model_1 = require("./state.model");
var websocket_1 = require("@/api/websocket");
var main_1 = require("@gl/main");
var useWsMessage = function (kvm, onOpen) {
    var webrtcTurnConfigWaited = (0, vue_1.ref)(false);
    /** 是否已经等待过turn服务（只等待一次） */
    //   const configStore = useConfigStore();
    /** 消息列表 */
    var msgs = (0, vue_1.ref)([]);
    /** 最新的api消息 */
    var latestWsApiMessage = (0, vue_1.ref)();
    /** 最新的janus消息 */
    var latestJanusApiMessage = (0, vue_1.ref)();
    /** 播放流状态 */
    var streamerState = (0, vue_1.ref)();
    /** 元数据 */
    // const metaState = ref<StreamEventState>()
    // /** 系统状态 */
    // const systemState = ref<StreamEventState>()
    // /** 额外信息 */
    // const extraState = ref<StreamEventState>()
    /** hid信息 */
    var hidState = (0, vue_1.ref)();
    /** atx信息 */
    var atxState = (0, vue_1.ref)();
    /** turn 信息 */
    var turnState = (0, vue_1.ref)();
    /** 手指机器人状态 */
    var fingerbotState = (0, vue_1.ref)();
    /** 视频 janus 的名称 */
    var videoJanusName = (0, vue_1.ref)("");
    /** 在线状态 */
    var connected = (0, vue_1.computed)(function () { return !!sockets.apiWS; });
    /** 正在设置的值 */
    var settingConfig = (0, vue_1.ref)({
        h264_bitrate: null,
        h264_gop: null,
    });
    /** sockets 两个  /api/ws 和 janus/ws 两个ws */
    var sockets = (0, vue_1.reactive)({
        /** apiWs主要是用于传递一些状态信息之类的 */
        apiWS: null,
        /** janusWs是janus服务发送的消息（主要是webRtc媒体流有关的） */
        janusWS: null,
    });
    var listeners = new Map();
    var on = function (type, callback) {
        listeners.set(type, callback);
    };
    /** 初始化/api/ws的消息连接 */
    var initApiWsMsgs = function () { return __awaiter(void 0, void 0, void 0, function () {
        var wsProtocol, socket;
        return __generator(this, function (_a) {
            if (sockets.apiWS) {
                return [2 /*return*/];
            }
            wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
            socket = new websocket_1.WebSocketService("".concat(wsProtocol, "://").concat(location.host, "/kvm/").concat(kvm.id, "/api/ws"), null, function (data) {
                latestWsApiMessage.value = data;
                msgs.value.push(data);
                parseData(data);
            }, true);
            socket.on("open", function () {
                sockets.apiWS = socket;
                onOpen === null || onOpen === void 0 ? void 0 : onOpen(socket);
            });
            return [2 /*return*/];
        });
    }); };
    var mouseAbsolute = (0, vue_1.computed)(function () {
        if (!hidState.value) {
            return true;
        }
        return hidState.value.mouse.absolute;
    });
    /** 视频流是否在线 */
    var isStreamOnline = (0, vue_1.computed)(function () {
        var _a, _b;
        if (!streamerState.value) {
            return false;
        }
        return (_b = (_a = streamerState.value.streamer) === null || _a === void 0 ? void 0 : _a.source) === null || _b === void 0 ? void 0 : _b.online;
    });
    var closeApiWs = function () {
        var _a;
        (_a = sockets.apiWS) === null || _a === void 0 ? void 0 : _a.close();
        sockets.apiWS = null;
    };
    var initJanusWsMsgs = function () { return __awaiter(void 0, void 0, void 0, function () {
        var socket;
        return __generator(this, function (_a) {
            if (sockets.apiWS) {
                return [2 /*return*/];
            }
            socket = new websocket_1.WebSocketService("/janus/ws", "janus-protocol", function (data) {
                latestJanusApiMessage.value = data;
                msgs.value.push(data);
            });
            socket.on("open", function () {
                sockets.apiWS = socket;
            });
            return [2 /*return*/];
        });
    }); };
    /** 初始化api/ws的消息连接 */
    initApiWsMsgs();
    /** 设置流媒体信息 */
    var setStreamerState = function (data) {
        var params = data.params;
        // 这里有做处理，如果系统设置了bitrate 或 gop，但是收到的消息反过来的还是设置前的，就忽略消息
        if (settingConfig.value.h264_bitrate) {
            if (settingConfig.value.h264_bitrate !== params.h264_bitrate) {
                params.h264_bitrate = settingConfig.value.h264_bitrate;
            }
            else {
                settingConfig.value.h264_bitrate = null;
            }
        }
        if (settingConfig.value.h264_gop !== null) {
            if (settingConfig.value.h264_gop !== params.h264_gop) {
                params.h264_gop = settingConfig.value.h264_gop;
            }
            else {
                settingConfig.value.h264_gop = null;
            }
        }
        streamerState.value = data;
    };
    /** 解析消息 */
    var parseData = function (data) {
        switch (data.event_type) {
            case kvm_model_1.WsEventType.STREAMER_STATE:
                // eslint-disable-next-line no-case-declarations
                setStreamerState(data.event);
                break;
                // case WsEventType.INFO_META_STATE:
                //     metaState.value = data.event
                //     break
                // case WsEventType.INFO_EXTRAS_STATE:
                //     extraState.value = data.event
                //     break
                // case WsEventType.INFO_SYSTEM_STATE:
                //     systemState.value = data.event
                break;
            case kvm_model_1.WsEventType.HID_STATE:
                hidState.value = data.event;
                break;
            case kvm_model_1.WsEventType.ATX_STATE:
                atxState.value = data.event;
                break;
            case kvm_model_1.WsEventType.FINGERBOT_STATE:
                fingerbotState.value = data.event;
                break;
            case kvm_model_1.WsEventType.MSD_STATE:
                // useMSDStore().setMSDState(data.event);
                break;
            case kvm_model_1.WsEventType.TURN_STATE:
                setTurnState(data.event);
                webrtcTurnConfigWaited.value = true;
                break;
        }
    };
    /** 模拟的鼠标个数 */
    var mouseMockCount = (0, vue_1.computed)(function () {
        try {
            return hidState.value.mouse.outputs.available.length;
        }
        catch (error) {
            return null;
        }
    });
    /** 将后端给的turn配置转为前端的turn配置 */
    var rtcConfig = (0, vue_1.computed)(function () {
        // return {}
        if (!turnState.value) {
            return {
                iceTransportPolicy: "all",
            };
        }
        return {
            iceTransportPolicy: "all",
            iceServers: [
                {
                    urls: turnState.value.uris,
                    username: turnState.value.username,
                    credential: turnState.value.password,
                },
            ],
        };
    });
    /** 等待rtcConfig 配置完成 */
    var waitRtcConfigOnly = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (webrtcTurnConfigWaited.value) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, main_1.sleep)(100)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, waitRtcConfigOnly()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    /** 等待rtcConfig 配置完成但是设置最大等待时间 */
    var waitForRtcConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
        var MAX_WAIT_RTC_CONFIG_TIME;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    MAX_WAIT_RTC_CONFIG_TIME = 5000;
                    return [4 /*yield*/, Promise.race([waitRtcConfigOnly(), (0, main_1.sleep)(MAX_WAIT_RTC_CONFIG_TIME)])];
                case 1:
                    _a.sent();
                    webrtcTurnConfigWaited.value = true;
                    return [2 /*return*/];
            }
        });
    }); };
    /** 设置视频 janus 的名称 */
    var setVideoJanusName = function (name) {
        videoJanusName.value = name;
    };
    /** 分辨率信息 */
    var resolutionText = (0, vue_1.computed)(function () {
        try {
            var title = videoJanusName.value;
            var _a = streamerState.value.streamer.source.resolution, width = _a.width, height = _a.height;
            return "".concat(title, " - ").concat(width, "x").concat(height, " / ");
        }
        catch (error) {
            return "";
        }
    });
    var resolutionTextOnly = (0, vue_1.computed)(function () {
        try {
            var _a = streamerState.value.streamer.source.resolution, width = _a.width, height = _a.height;
            return "".concat(width, "x").concat(height);
        }
        catch (error) {
            return "";
        }
    });
    /** 是否插入了atx power */
    var atxPowerEnabled = (0, vue_1.computed)(function () {
        var _a;
        return (_a = atxState.value) === null || _a === void 0 ? void 0 : _a.enabled;
    });
    /** 是否插入了fingerbot */
    var fingerbotEnabled = (0, vue_1.computed)(function () {
        var _a;
        return (_a = fingerbotState.value) === null || _a === void 0 ? void 0 : _a.exist;
    });
    /** 判断是否插入了hdmi线 */
    var hdmiLinePlugged = (0, vue_1.computed)(function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = streamerState.value) === null || _a === void 0 ? void 0 : _a.streamer) === null || _b === void 0 ? void 0 : _b.hdmi) === null || _c === void 0 ? void 0 : _c.signal;
    });
    var setTurnState = function (data) {
        var _a;
        if (turnState.value && (0, state_model_1.isEqualJsonObj)(turnState.value, data)) {
            return;
        }
        var oldValue = turnState.value;
        turnState.value = data;
        if (oldValue) {
            (_a = listeners.get("turn_change")) === null || _a === void 0 ? void 0 : _a();
        }
    };
    //   const getTurnConfigManually = async () => {
    //     try {
    //       const data = await mainService.getRtcTurnConfig();
    //       setTurnState(data);
    //       webrtcTurnConfigWaited.value = true;
    //     } catch (error) {
    //       //
    //     }
    //   };
    //   getTurnConfigManually();
    //   watch(
    //     () => atxPowerEnabled.value || fingerbotEnabled.value,
    //     (val) => {
    //       if (
    //         !val &&
    //         configStore.state.leftPanelEnum === LeftPanelEnum.EXTERNAL_DEVICES
    //       ) {
    //         configStore.toggleLeftPanel(LeftPanelEnum.NONE);
    //       }
    //     }
    //   );
    return {
        webrtcTurnConfigWaited: webrtcTurnConfigWaited,
        msgs: msgs,
        latestWsApiMessage: latestWsApiMessage,
        latestJanusApiMessage: latestJanusApiMessage,
        initApiWsMsgs: initApiWsMsgs,
        closeApiWs: closeApiWs,
        initJanusWsMsgs: initJanusWsMsgs,
        setVideoJanusName: setVideoJanusName,
        resolutionText: resolutionText,
        streamerState: streamerState,
        // metaState,
        hidState: hidState,
        atxState: atxState,
        fingerbotState: fingerbotState,
        // systemState,
        // extraState,
        sockets: sockets,
        connected: connected,
        rtcConfig: rtcConfig,
        setStreamerState: setStreamerState,
        settingConfig: settingConfig,
        isStreamOnline: isStreamOnline,
        atxPowerEnabled: atxPowerEnabled,
        fingerbotEnabled: fingerbotEnabled,
        resolutionTextOnly: resolutionTextOnly,
        hdmiLinePlugged: hdmiLinePlugged,
        mouseAbsolute: mouseAbsolute,
        waitForRtcConfig: waitForRtcConfig,
        mouseMockCount: mouseMockCount,
        on: on,
    };
};
exports.useWsMessage = useWsMessage;
