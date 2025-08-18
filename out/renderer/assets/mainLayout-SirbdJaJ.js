import { M as Me, c as cr, r as ref, a as computed, b as reactive, d as browser, e as defineComponent, f as createBlock, w as withCtx, u as unref, g as bo, h as createCommentVNode, i as go, j as createVNode, k as fo, F as FormItem, v as vo, l as an, o as openBlock, E as ErrorMsgHandler, m as createElementBlock, n as createBaseVNode, p as createTextVNode, t as toDisplayString, A as At, O as Oo, q as withModifiers, x, s as Mo, y as Fragment, $ as $o, z as ko, B as renderList, Q, D, C as onMounted, G as onBeforeUnmount, H as normalizeClass, I as normalizeStyle, J as renderSlot, K as Ae, T as Tooltip, L as useRouter, N as removeLogin } from "./index-BWnXo6Ks.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
function Er(e = 1500, t) {
  return new Promise((n) => {
    setTimeout(() => {
      n(t);
    }, e);
  });
}
const DEFAULT_REQUEST_TIMEOUT = 3e4;
const httpService = new Me(
  { timeout: DEFAULT_REQUEST_TIMEOUT, apiPrefix: "/cloud-basic", baseURL: "http://localhost:4004" },
  () => {
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (response) => {
    log(response);
    const res = { data: { info: response.data?.info } };
    return res;
  },
  (error) => {
    return Promise.reject(error);
  }
);
const mainService = {
  login(id) {
    const data = new FormData();
    data.append("user", "admin");
    data.append("passwd", "admin");
    return httpService.get(`/kvm-api/${id}/api/upgrade/version`);
  },
  getKvmDeviceList() {
    return httpService.get("/api/kvm/list");
  },
  addKvmDevice(info) {
    return httpService.post("/api/kvm/add", info);
  },
  deleteKvmDevice(id) {
    return httpService.delete(`/api/kvm/delete/${id}`);
  },
  connectKvm(id) {
    return httpService.post("/api/kvm/connect", null, { params: { id } });
  }
};
[
  { tip: "0.5s", ...new cr("power", "main.powerShort") },
  { tip: "6.5s", ...new cr("power_long", "main.powerLong") },
  { tip: null, ...new cr("reset", "main.restart") }
];
function isEqualJsonObj(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2) || obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!isEqualJsonObj(obj1[i], obj2[i])) return false;
    }
    return true;
  }
  if (typeof obj1 === "object") {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!isEqualJsonObj(obj1[key], obj2[key])) return false;
    }
    return true;
  }
  return false;
}
const HEARTBEAT_INTERVAL = 2e3;
class WebSocketService {
  constructor(url, protocol, onMessage, needHeartBeat = false) {
    this.url = url;
    this.protocol = protocol;
    this.onMessage = onMessage;
    this.needHeartBeat = needHeartBeat;
    this.init();
  }
  socket;
  isOpen = false;
  heartBeatTimer = null;
  eventCallbacks = /* @__PURE__ */ new Map();
  init() {
    this.socket = new WebSocket(this.url, this.protocol || void 0);
    this.configSocketLifeCircle();
  }
  /** 配置 socket 的生命周期 */
  configSocketLifeCircle() {
    this.socket.onopen = () => {
      console.log("WebSocket connected");
      this.eventCallbacks.get("open")?.();
      this.needHeartBeat && this.sendHeartbeat();
      this.isOpen = true;
    };
    this.socket.onclose = () => {
      console.log("WebSocket disconnected");
      this.isOpen = false;
    };
    this.socket.onerror = (error) => {
      console.log("WebSocket error:", error);
      this.close();
      this.isOpen = false;
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.onMessage?.(data);
    };
  }
  /** 发送心跳 */
  sendHeartbeat() {
    this.heartBeatTimer = setTimeout(() => {
      if (!this.isOpen) {
        log("heartbeat error");
        return;
      }
      this.send(
        JSON.stringify({
          event_type: "ping",
          event: {}
        })
      );
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }
  /** 暴露出去的注册事件的方法 */
  on(eventType, callback) {
    this.eventCallbacks.set(eventType, callback);
  }
  /** 发送消息 */
  send(message) {
    this.socket.send(message);
  }
  /** 关闭连接 */
  close() {
    this.heartBeatTimer && clearTimeout(this.heartBeatTimer);
    this.socket.close();
    this.isOpen = false;
  }
}
const useWsMessage = (kvm, onOpen) => {
  const webrtcTurnConfigWaited = ref(false);
  const msgs = ref([]);
  const latestWsApiMessage = ref();
  const latestJanusApiMessage = ref();
  const streamerState = ref();
  const hidState = ref();
  const atxState = ref();
  const turnState = ref();
  const fingerbotState = ref();
  const videoJanusName = ref("");
  const connected = computed(() => !!sockets.apiWS);
  const settingConfig = ref({
    h264_bitrate: null,
    h264_gop: null
  });
  const sockets = reactive({
    /** apiWs主要是用于传递一些状态信息之类的 */
    apiWS: null,
    /** janusWs是janus服务发送的消息（主要是webRtc媒体流有关的） */
    janusWS: null
  });
  const listeners = /* @__PURE__ */ new Map();
  const on = (type, callback) => {
    listeners.set(type, callback);
  };
  const initApiWsMsgs = async () => {
    if (sockets.apiWS) {
      return;
    }
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocketService(
      `${wsProtocol}://localhost:4004/kvm-api/${kvm.id}/api/ws`,
      null,
      (data) => {
        latestWsApiMessage.value = data;
        msgs.value.push(data);
        parseData(data);
      },
      true
    );
    socket.on("open", () => {
      sockets.apiWS = socket;
      onOpen?.(socket);
    });
  };
  const mouseAbsolute = computed(() => {
    if (!hidState.value) {
      return true;
    }
    return hidState.value.mouse.absolute;
  });
  const isStreamOnline = computed(() => {
    if (!streamerState.value) {
      return false;
    }
    return streamerState.value.streamer?.source?.online;
  });
  const closeApiWs = () => {
    sockets.apiWS?.close();
    sockets.apiWS = null;
  };
  const initJanusWsMsgs = async () => {
    if (sockets.apiWS) {
      return;
    }
    const socket = new WebSocketService("/janus/ws", "janus-protocol", (data) => {
      latestJanusApiMessage.value = data;
      msgs.value.push(data);
    });
    socket.on("open", () => {
      sockets.apiWS = socket;
    });
  };
  initApiWsMsgs();
  const setStreamerState = (data) => {
    const { params } = data;
    if (settingConfig.value.h264_bitrate) {
      if (settingConfig.value.h264_bitrate !== params.h264_bitrate) {
        params.h264_bitrate = settingConfig.value.h264_bitrate;
      } else {
        settingConfig.value.h264_bitrate = null;
      }
    }
    if (settingConfig.value.h264_gop !== null) {
      if (settingConfig.value.h264_gop !== params.h264_gop) {
        params.h264_gop = settingConfig.value.h264_gop;
      } else {
        settingConfig.value.h264_gop = null;
      }
    }
    streamerState.value = data;
  };
  const parseData = (data) => {
    switch (data.event_type) {
      case WsEventType.STREAMER_STATE:
        setStreamerState(data.event);
        break;
      case WsEventType.HID_STATE:
        hidState.value = data.event;
        break;
      case WsEventType.ATX_STATE:
        atxState.value = data.event;
        break;
      case WsEventType.FINGERBOT_STATE:
        fingerbotState.value = data.event;
        break;
      case WsEventType.MSD_STATE:
        break;
      case WsEventType.TURN_STATE:
        setTurnState(data.event);
        webrtcTurnConfigWaited.value = true;
        break;
    }
  };
  const mouseMockCount = computed(() => {
    try {
      return hidState.value.mouse.outputs.available.length;
    } catch (error) {
      return null;
    }
  });
  const rtcConfig = computed(() => {
    if (!turnState.value) {
      return {
        iceTransportPolicy: "all"
      };
    }
    return {
      iceTransportPolicy: "all",
      iceServers: [
        {
          urls: turnState.value.uris,
          username: turnState.value.username,
          credential: turnState.value.password
        }
      ]
    };
  });
  const waitRtcConfigOnly = async () => {
    if (webrtcTurnConfigWaited.value) {
      return;
    }
    await Er(100);
    await waitRtcConfigOnly();
  };
  const waitForRtcConfig = async () => {
    const MAX_WAIT_RTC_CONFIG_TIME = 5e3;
    await Promise.race([waitRtcConfigOnly(), Er(MAX_WAIT_RTC_CONFIG_TIME)]);
    webrtcTurnConfigWaited.value = true;
  };
  const setVideoJanusName = (name) => {
    videoJanusName.value = name;
  };
  const resolutionText = computed(() => {
    try {
      const title = videoJanusName.value;
      const { width, height } = streamerState.value.streamer.source.resolution;
      return `${title} - ${width}x${height} / `;
    } catch (error) {
      return "";
    }
  });
  const resolutionTextOnly = computed(() => {
    try {
      const { width, height } = streamerState.value.streamer.source.resolution;
      return `${width}x${height}`;
    } catch (error) {
      return "";
    }
  });
  const atxPowerEnabled = computed(() => {
    return atxState.value?.enabled;
  });
  const fingerbotEnabled = computed(() => {
    return fingerbotState.value?.exist;
  });
  const hdmiLinePlugged = computed(() => {
    return streamerState.value?.streamer?.hdmi?.signal;
  });
  const setTurnState = (data) => {
    if (turnState.value && isEqualJsonObj(turnState.value, data)) {
      return;
    }
    const oldValue = turnState.value;
    turnState.value = data;
    if (oldValue) {
      listeners.get("turn_change")?.();
    }
  };
  return {
    webrtcTurnConfigWaited,
    msgs,
    latestWsApiMessage,
    latestJanusApiMessage,
    initApiWsMsgs,
    closeApiWs,
    initJanusWsMsgs,
    setVideoJanusName,
    resolutionText,
    streamerState,
    // metaState,
    hidState,
    atxState,
    fingerbotState,
    // systemState,
    // extraState,
    sockets,
    connected,
    rtcConfig,
    setStreamerState,
    settingConfig,
    isStreamOnline,
    atxPowerEnabled,
    fingerbotEnabled,
    resolutionTextOnly,
    hdmiLinePlugged,
    mouseAbsolute,
    waitForRtcConfig,
    mouseMockCount,
    on
  };
};
(function(f) {
  if (typeof exports === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }
    g.adapter = f();
  }
})(function() {
  return (/* @__PURE__ */ (function() {
    function r(e, n, t) {
      function o(i2, f) {
        if (!n[i2]) {
          if (!e[i2]) {
            var c = "function" == typeof require && require;
            if (!f && c) return c(i2, true);
            if (u) return u(i2, true);
            var a = new Error("Cannot find module '" + i2 + "'");
            throw a.code = "MODULE_NOT_FOUND", a;
          }
          var p = n[i2] = { exports: {} };
          e[i2][0].call(p.exports, function(r2) {
            var n2 = e[i2][1][r2];
            return o(n2 || r2);
          }, p, p.exports, r, e, n, t);
        }
        return n[i2].exports;
      }
      for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
      return o;
    }
    return r;
  })())({
    1: [function(require2, module3, exports3) {
      var _adapter_factory = require2("./adapter_factory.js");
      var adapter2 = (0, _adapter_factory.adapterFactory)({
        window: typeof window === "undefined" ? void 0 : window
      });
      module3.exports = adapter2;
    }, { "./adapter_factory.js": 2 }],
    2: [function(require2, module3, exports3) {
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.adapterFactory = adapterFactory;
      var utils = _interopRequireWildcard(require2("./utils"));
      var chromeShim = _interopRequireWildcard(require2("./chrome/chrome_shim"));
      var firefoxShim = _interopRequireWildcard(require2("./firefox/firefox_shim"));
      var safariShim = _interopRequireWildcard(require2("./safari/safari_shim"));
      var commonShim = _interopRequireWildcard(require2("./common_shim"));
      var sdp = _interopRequireWildcard(require2("sdp"));
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function adapterFactory() {
        var _ref = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, window2 = _ref.window;
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
          shimChrome: true,
          shimFirefox: true,
          shimSafari: true
        };
        var logging = utils.log;
        var browserDetails = utils.detectBrowser(window2);
        var adapter2 = {
          browserDetails,
          commonShim,
          extractVersion: utils.extractVersion,
          disableLog: utils.disableLog,
          disableWarnings: utils.disableWarnings,
          // Expose sdp as a convenience. For production apps include directly.
          sdp
        };
        switch (browserDetails.browser) {
          case "chrome":
            if (!chromeShim || !chromeShim.shimPeerConnection || !options.shimChrome) {
              logging("Chrome shim is not included in this adapter release.");
              return adapter2;
            }
            if (browserDetails.version === null) {
              logging("Chrome shim can not determine version, not shimming.");
              return adapter2;
            }
            logging("adapter.js shimming chrome.");
            adapter2.browserShim = chromeShim;
            commonShim.shimAddIceCandidateNullOrEmpty(window2, browserDetails);
            commonShim.shimParameterlessSetLocalDescription(window2, browserDetails);
            chromeShim.shimGetUserMedia(window2, browserDetails);
            chromeShim.shimMediaStream(window2, browserDetails);
            chromeShim.shimPeerConnection(window2, browserDetails);
            chromeShim.shimOnTrack(window2, browserDetails);
            chromeShim.shimAddTrackRemoveTrack(window2, browserDetails);
            chromeShim.shimGetSendersWithDtmf(window2, browserDetails);
            chromeShim.shimSenderReceiverGetStats(window2, browserDetails);
            chromeShim.fixNegotiationNeeded(window2, browserDetails);
            commonShim.shimRTCIceCandidate(window2, browserDetails);
            commonShim.shimRTCIceCandidateRelayProtocol(window2, browserDetails);
            commonShim.shimConnectionState(window2, browserDetails);
            commonShim.shimMaxMessageSize(window2, browserDetails);
            commonShim.shimSendThrowTypeError(window2, browserDetails);
            commonShim.removeExtmapAllowMixed(window2, browserDetails);
            break;
          case "firefox":
            if (!firefoxShim || !firefoxShim.shimPeerConnection || !options.shimFirefox) {
              logging("Firefox shim is not included in this adapter release.");
              return adapter2;
            }
            logging("adapter.js shimming firefox.");
            adapter2.browserShim = firefoxShim;
            commonShim.shimAddIceCandidateNullOrEmpty(window2, browserDetails);
            commonShim.shimParameterlessSetLocalDescription(window2, browserDetails);
            firefoxShim.shimGetUserMedia(window2, browserDetails);
            firefoxShim.shimPeerConnection(window2, browserDetails);
            firefoxShim.shimOnTrack(window2, browserDetails);
            firefoxShim.shimRemoveStream(window2, browserDetails);
            firefoxShim.shimSenderGetStats(window2, browserDetails);
            firefoxShim.shimReceiverGetStats(window2, browserDetails);
            firefoxShim.shimRTCDataChannel(window2, browserDetails);
            firefoxShim.shimAddTransceiver(window2, browserDetails);
            firefoxShim.shimGetParameters(window2, browserDetails);
            firefoxShim.shimCreateOffer(window2, browserDetails);
            firefoxShim.shimCreateAnswer(window2, browserDetails);
            commonShim.shimRTCIceCandidate(window2, browserDetails);
            commonShim.shimConnectionState(window2, browserDetails);
            commonShim.shimMaxMessageSize(window2, browserDetails);
            commonShim.shimSendThrowTypeError(window2, browserDetails);
            break;
          case "safari":
            if (!safariShim || !options.shimSafari) {
              logging("Safari shim is not included in this adapter release.");
              return adapter2;
            }
            logging("adapter.js shimming safari.");
            adapter2.browserShim = safariShim;
            commonShim.shimAddIceCandidateNullOrEmpty(window2, browserDetails);
            commonShim.shimParameterlessSetLocalDescription(window2, browserDetails);
            safariShim.shimRTCIceServerUrls(window2, browserDetails);
            safariShim.shimCreateOfferLegacy(window2, browserDetails);
            safariShim.shimCallbacksAPI(window2, browserDetails);
            safariShim.shimLocalStreamsAPI(window2, browserDetails);
            safariShim.shimRemoteStreamsAPI(window2, browserDetails);
            safariShim.shimTrackEventTransceiver(window2, browserDetails);
            safariShim.shimGetUserMedia(window2, browserDetails);
            safariShim.shimAudioContext(window2, browserDetails);
            commonShim.shimRTCIceCandidate(window2, browserDetails);
            commonShim.shimRTCIceCandidateRelayProtocol(window2, browserDetails);
            commonShim.shimMaxMessageSize(window2, browserDetails);
            commonShim.shimSendThrowTypeError(window2, browserDetails);
            commonShim.removeExtmapAllowMixed(window2, browserDetails);
            break;
          default:
            logging("Unsupported browser!");
            break;
        }
        return adapter2;
      }
    }, { "./chrome/chrome_shim": 3, "./common_shim": 5, "./firefox/firefox_shim": 6, "./safari/safari_shim": 9, "./utils": 10, "sdp": 11 }],
    3: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.fixNegotiationNeeded = fixNegotiationNeeded;
      exports3.shimAddTrackRemoveTrack = shimAddTrackRemoveTrack;
      exports3.shimAddTrackRemoveTrackWithNative = shimAddTrackRemoveTrackWithNative;
      exports3.shimGetSendersWithDtmf = shimGetSendersWithDtmf;
      Object.defineProperty(exports3, "shimGetUserMedia", {
        enumerable: true,
        get: function get() {
          return _getusermedia.shimGetUserMedia;
        }
      });
      exports3.shimMediaStream = shimMediaStream;
      exports3.shimOnTrack = shimOnTrack;
      exports3.shimPeerConnection = shimPeerConnection;
      exports3.shimSenderReceiverGetStats = shimSenderReceiverGetStats;
      var utils = _interopRequireWildcard(require2("../utils.js"));
      var _getusermedia = require2("./getusermedia");
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function _defineProperty(obj, key, value) {
        key = _toPropertyKey(key);
        if (key in obj) {
          Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _toPropertyKey(t) {
        var i = _toPrimitive(t, "string");
        return "symbol" == _typeof(i) ? i : i + "";
      }
      function _toPrimitive(t, r) {
        if ("object" != _typeof(t) || !t) return t;
        var e = t[Symbol.toPrimitive];
        if (void 0 !== e) {
          var i = e.call(t, r);
          if ("object" != _typeof(i)) return i;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return ("string" === r ? String : Number)(t);
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      function shimMediaStream(window2) {
        window2.MediaStream = window2.MediaStream || window2.webkitMediaStream;
      }
      function shimOnTrack(window2) {
        if (_typeof(window2) === "object" && window2.RTCPeerConnection && !("ontrack" in window2.RTCPeerConnection.prototype)) {
          Object.defineProperty(window2.RTCPeerConnection.prototype, "ontrack", {
            get: function get() {
              return this._ontrack;
            },
            set: function set(f) {
              if (this._ontrack) {
                this.removeEventListener("track", this._ontrack);
              }
              this.addEventListener("track", this._ontrack = f);
            },
            enumerable: true,
            configurable: true
          });
          var origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
          window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
            var _this = this;
            if (!this._ontrackpoly) {
              this._ontrackpoly = function(e) {
                e.stream.addEventListener("addtrack", function(te) {
                  var receiver;
                  if (window2.RTCPeerConnection.prototype.getReceivers) {
                    receiver = _this.getReceivers().find(function(r) {
                      return r.track && r.track.id === te.track.id;
                    });
                  } else {
                    receiver = {
                      track: te.track
                    };
                  }
                  var event = new Event("track");
                  event.track = te.track;
                  event.receiver = receiver;
                  event.transceiver = {
                    receiver
                  };
                  event.streams = [e.stream];
                  _this.dispatchEvent(event);
                });
                e.stream.getTracks().forEach(function(track) {
                  var receiver;
                  if (window2.RTCPeerConnection.prototype.getReceivers) {
                    receiver = _this.getReceivers().find(function(r) {
                      return r.track && r.track.id === track.id;
                    });
                  } else {
                    receiver = {
                      track
                    };
                  }
                  var event = new Event("track");
                  event.track = track;
                  event.receiver = receiver;
                  event.transceiver = {
                    receiver
                  };
                  event.streams = [e.stream];
                  _this.dispatchEvent(event);
                });
              };
              this.addEventListener("addstream", this._ontrackpoly);
            }
            return origSetRemoteDescription.apply(this, arguments);
          };
        } else {
          utils.wrapPeerConnectionEvent(window2, "track", function(e) {
            if (!e.transceiver) {
              Object.defineProperty(e, "transceiver", {
                value: {
                  receiver: e.receiver
                }
              });
            }
            return e;
          });
        }
      }
      function shimGetSendersWithDtmf(window2) {
        if (_typeof(window2) === "object" && window2.RTCPeerConnection && !("getSenders" in window2.RTCPeerConnection.prototype) && "createDTMFSender" in window2.RTCPeerConnection.prototype) {
          var shimSenderWithDtmf = function shimSenderWithDtmf2(pc, track) {
            return {
              track,
              get dtmf() {
                if (this._dtmf === void 0) {
                  if (track.kind === "audio") {
                    this._dtmf = pc.createDTMFSender(track);
                  } else {
                    this._dtmf = null;
                  }
                }
                return this._dtmf;
              },
              _pc: pc
            };
          };
          if (!window2.RTCPeerConnection.prototype.getSenders) {
            window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
              this._senders = this._senders || [];
              return this._senders.slice();
            };
            var origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
            window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
              var sender = origAddTrack.apply(this, arguments);
              if (!sender) {
                sender = shimSenderWithDtmf(this, track);
                this._senders.push(sender);
              }
              return sender;
            };
            var origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
            window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
              origRemoveTrack.apply(this, arguments);
              var idx = this._senders.indexOf(sender);
              if (idx !== -1) {
                this._senders.splice(idx, 1);
              }
            };
          }
          var origAddStream = window2.RTCPeerConnection.prototype.addStream;
          window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
            var _this2 = this;
            this._senders = this._senders || [];
            origAddStream.apply(this, [stream]);
            stream.getTracks().forEach(function(track) {
              _this2._senders.push(shimSenderWithDtmf(_this2, track));
            });
          };
          var origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
          window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
            var _this3 = this;
            this._senders = this._senders || [];
            origRemoveStream.apply(this, [stream]);
            stream.getTracks().forEach(function(track) {
              var sender = _this3._senders.find(function(s) {
                return s.track === track;
              });
              if (sender) {
                _this3._senders.splice(_this3._senders.indexOf(sender), 1);
              }
            });
          };
        } else if (_typeof(window2) === "object" && window2.RTCPeerConnection && "getSenders" in window2.RTCPeerConnection.prototype && "createDTMFSender" in window2.RTCPeerConnection.prototype && window2.RTCRtpSender && !("dtmf" in window2.RTCRtpSender.prototype)) {
          var origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
          window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
            var _this4 = this;
            var senders = origGetSenders.apply(this, []);
            senders.forEach(function(sender) {
              return sender._pc = _this4;
            });
            return senders;
          };
          Object.defineProperty(window2.RTCRtpSender.prototype, "dtmf", {
            get: function get() {
              if (this._dtmf === void 0) {
                if (this.track.kind === "audio") {
                  this._dtmf = this._pc.createDTMFSender(this.track);
                } else {
                  this._dtmf = null;
                }
              }
              return this._dtmf;
            }
          });
        }
      }
      function shimSenderReceiverGetStats(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCPeerConnection && window2.RTCRtpSender && window2.RTCRtpReceiver)) {
          return;
        }
        if (!("getStats" in window2.RTCRtpSender.prototype)) {
          var origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
          if (origGetSenders) {
            window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
              var _this5 = this;
              var senders = origGetSenders.apply(this, []);
              senders.forEach(function(sender) {
                return sender._pc = _this5;
              });
              return senders;
            };
          }
          var origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
          if (origAddTrack) {
            window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
              var sender = origAddTrack.apply(this, arguments);
              sender._pc = this;
              return sender;
            };
          }
          window2.RTCRtpSender.prototype.getStats = function getStats() {
            var sender = this;
            return this._pc.getStats().then(function(result) {
              return (
                /* Note: this will include stats of all senders that
                 *   send a track with the same id as sender.track as
                 *   it is not possible to identify the RTCRtpSender.
                 */
                utils.filterStats(result, sender.track, true)
              );
            });
          };
        }
        if (!("getStats" in window2.RTCRtpReceiver.prototype)) {
          var origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
          if (origGetReceivers) {
            window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
              var _this6 = this;
              var receivers = origGetReceivers.apply(this, []);
              receivers.forEach(function(receiver) {
                return receiver._pc = _this6;
              });
              return receivers;
            };
          }
          utils.wrapPeerConnectionEvent(window2, "track", function(e) {
            e.receiver._pc = e.srcElement;
            return e;
          });
          window2.RTCRtpReceiver.prototype.getStats = function getStats() {
            var receiver = this;
            return this._pc.getStats().then(function(result) {
              return utils.filterStats(result, receiver.track, false);
            });
          };
        }
        if (!("getStats" in window2.RTCRtpSender.prototype && "getStats" in window2.RTCRtpReceiver.prototype)) {
          return;
        }
        var origGetStats = window2.RTCPeerConnection.prototype.getStats;
        window2.RTCPeerConnection.prototype.getStats = function getStats() {
          if (arguments.length > 0 && arguments[0] instanceof window2.MediaStreamTrack) {
            var track = arguments[0];
            var sender;
            var receiver;
            var err;
            this.getSenders().forEach(function(s) {
              if (s.track === track) {
                if (sender) {
                  err = true;
                } else {
                  sender = s;
                }
              }
            });
            this.getReceivers().forEach(function(r) {
              if (r.track === track) {
                if (receiver) {
                  err = true;
                } else {
                  receiver = r;
                }
              }
              return r.track === track;
            });
            if (err || sender && receiver) {
              return Promise.reject(new DOMException("There are more than one sender or receiver for the track.", "InvalidAccessError"));
            } else if (sender) {
              return sender.getStats();
            } else if (receiver) {
              return receiver.getStats();
            }
            return Promise.reject(new DOMException("There is no sender or receiver for the track.", "InvalidAccessError"));
          }
          return origGetStats.apply(this, arguments);
        };
      }
      function shimAddTrackRemoveTrackWithNative(window2) {
        window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
          var _this7 = this;
          this._shimmedLocalStreams = this._shimmedLocalStreams || {};
          return Object.keys(this._shimmedLocalStreams).map(function(streamId) {
            return _this7._shimmedLocalStreams[streamId][0];
          });
        };
        var origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
        window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
          if (!stream) {
            return origAddTrack.apply(this, arguments);
          }
          this._shimmedLocalStreams = this._shimmedLocalStreams || {};
          var sender = origAddTrack.apply(this, arguments);
          if (!this._shimmedLocalStreams[stream.id]) {
            this._shimmedLocalStreams[stream.id] = [stream, sender];
          } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
            this._shimmedLocalStreams[stream.id].push(sender);
          }
          return sender;
        };
        var origAddStream = window2.RTCPeerConnection.prototype.addStream;
        window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
          var _this8 = this;
          this._shimmedLocalStreams = this._shimmedLocalStreams || {};
          stream.getTracks().forEach(function(track) {
            var alreadyExists = _this8.getSenders().find(function(s) {
              return s.track === track;
            });
            if (alreadyExists) {
              throw new DOMException("Track already exists.", "InvalidAccessError");
            }
          });
          var existingSenders = this.getSenders();
          origAddStream.apply(this, arguments);
          var newSenders = this.getSenders().filter(function(newSender) {
            return existingSenders.indexOf(newSender) === -1;
          });
          this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
        };
        var origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
        window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
          this._shimmedLocalStreams = this._shimmedLocalStreams || {};
          delete this._shimmedLocalStreams[stream.id];
          return origRemoveStream.apply(this, arguments);
        };
        var origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
        window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
          var _this9 = this;
          this._shimmedLocalStreams = this._shimmedLocalStreams || {};
          if (sender) {
            Object.keys(this._shimmedLocalStreams).forEach(function(streamId) {
              var idx = _this9._shimmedLocalStreams[streamId].indexOf(sender);
              if (idx !== -1) {
                _this9._shimmedLocalStreams[streamId].splice(idx, 1);
              }
              if (_this9._shimmedLocalStreams[streamId].length === 1) {
                delete _this9._shimmedLocalStreams[streamId];
              }
            });
          }
          return origRemoveTrack.apply(this, arguments);
        };
      }
      function shimAddTrackRemoveTrack(window2, browserDetails) {
        if (!window2.RTCPeerConnection) {
          return;
        }
        if (window2.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
          return shimAddTrackRemoveTrackWithNative(window2);
        }
        var origGetLocalStreams = window2.RTCPeerConnection.prototype.getLocalStreams;
        window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
          var _this10 = this;
          var nativeStreams = origGetLocalStreams.apply(this);
          this._reverseStreams = this._reverseStreams || {};
          return nativeStreams.map(function(stream) {
            return _this10._reverseStreams[stream.id];
          });
        };
        var origAddStream = window2.RTCPeerConnection.prototype.addStream;
        window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
          var _this11 = this;
          this._streams = this._streams || {};
          this._reverseStreams = this._reverseStreams || {};
          stream.getTracks().forEach(function(track) {
            var alreadyExists = _this11.getSenders().find(function(s) {
              return s.track === track;
            });
            if (alreadyExists) {
              throw new DOMException("Track already exists.", "InvalidAccessError");
            }
          });
          if (!this._reverseStreams[stream.id]) {
            var newStream = new window2.MediaStream(stream.getTracks());
            this._streams[stream.id] = newStream;
            this._reverseStreams[newStream.id] = stream;
            stream = newStream;
          }
          origAddStream.apply(this, [stream]);
        };
        var origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
        window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
          this._streams = this._streams || {};
          this._reverseStreams = this._reverseStreams || {};
          origRemoveStream.apply(this, [this._streams[stream.id] || stream]);
          delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
          delete this._streams[stream.id];
        };
        window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
          var _this12 = this;
          if (this.signalingState === "closed") {
            throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
          }
          var streams = [].slice.call(arguments, 1);
          if (streams.length !== 1 || !streams[0].getTracks().find(function(t) {
            return t === track;
          })) {
            throw new DOMException("The adapter.js addTrack polyfill only supports a single  stream which is associated with the specified track.", "NotSupportedError");
          }
          var alreadyExists = this.getSenders().find(function(s) {
            return s.track === track;
          });
          if (alreadyExists) {
            throw new DOMException("Track already exists.", "InvalidAccessError");
          }
          this._streams = this._streams || {};
          this._reverseStreams = this._reverseStreams || {};
          var oldStream = this._streams[stream.id];
          if (oldStream) {
            oldStream.addTrack(track);
            Promise.resolve().then(function() {
              _this12.dispatchEvent(new Event("negotiationneeded"));
            });
          } else {
            var newStream = new window2.MediaStream([track]);
            this._streams[stream.id] = newStream;
            this._reverseStreams[newStream.id] = stream;
            this.addStream(newStream);
          }
          return this.getSenders().find(function(s) {
            return s.track === track;
          });
        };
        function replaceInternalStreamId(pc, description) {
          var sdp = description.sdp;
          Object.keys(pc._reverseStreams || []).forEach(function(internalId) {
            var externalStream = pc._reverseStreams[internalId];
            var internalStream = pc._streams[externalStream.id];
            sdp = sdp.replace(new RegExp(internalStream.id, "g"), externalStream.id);
          });
          return new RTCSessionDescription({
            type: description.type,
            sdp
          });
        }
        function replaceExternalStreamId(pc, description) {
          var sdp = description.sdp;
          Object.keys(pc._reverseStreams || []).forEach(function(internalId) {
            var externalStream = pc._reverseStreams[internalId];
            var internalStream = pc._streams[externalStream.id];
            sdp = sdp.replace(new RegExp(externalStream.id, "g"), internalStream.id);
          });
          return new RTCSessionDescription({
            type: description.type,
            sdp
          });
        }
        ["createOffer", "createAnswer"].forEach(function(method) {
          var nativeMethod = window2.RTCPeerConnection.prototype[method];
          var methodObj = _defineProperty({}, method, function() {
            var _this13 = this;
            var args = arguments;
            var isLegacyCall = arguments.length && typeof arguments[0] === "function";
            if (isLegacyCall) {
              return nativeMethod.apply(this, [function(description) {
                var desc = replaceInternalStreamId(_this13, description);
                args[0].apply(null, [desc]);
              }, function(err) {
                if (args[1]) {
                  args[1].apply(null, err);
                }
              }, arguments[2]]);
            }
            return nativeMethod.apply(this, arguments).then(function(description) {
              return replaceInternalStreamId(_this13, description);
            });
          });
          window2.RTCPeerConnection.prototype[method] = methodObj[method];
        });
        var origSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
        window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
          if (!arguments.length || !arguments[0].type) {
            return origSetLocalDescription.apply(this, arguments);
          }
          arguments[0] = replaceExternalStreamId(this, arguments[0]);
          return origSetLocalDescription.apply(this, arguments);
        };
        var origLocalDescription = Object.getOwnPropertyDescriptor(window2.RTCPeerConnection.prototype, "localDescription");
        Object.defineProperty(window2.RTCPeerConnection.prototype, "localDescription", {
          get: function get() {
            var description = origLocalDescription.get.apply(this);
            if (description.type === "") {
              return description;
            }
            return replaceInternalStreamId(this, description);
          }
        });
        window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
          var _this14 = this;
          if (this.signalingState === "closed") {
            throw new DOMException("The RTCPeerConnection's signalingState is 'closed'.", "InvalidStateError");
          }
          if (!sender._pc) {
            throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack does not implement interface RTCRtpSender.", "TypeError");
          }
          var isLocal = sender._pc === this;
          if (!isLocal) {
            throw new DOMException("Sender was not created by this connection.", "InvalidAccessError");
          }
          this._streams = this._streams || {};
          var stream;
          Object.keys(this._streams).forEach(function(streamid) {
            var hasTrack = _this14._streams[streamid].getTracks().find(function(track) {
              return sender.track === track;
            });
            if (hasTrack) {
              stream = _this14._streams[streamid];
            }
          });
          if (stream) {
            if (stream.getTracks().length === 1) {
              this.removeStream(this._reverseStreams[stream.id]);
            } else {
              stream.removeTrack(sender.track);
            }
            this.dispatchEvent(new Event("negotiationneeded"));
          }
        };
      }
      function shimPeerConnection(window2, browserDetails) {
        if (!window2.RTCPeerConnection && window2.webkitRTCPeerConnection) {
          window2.RTCPeerConnection = window2.webkitRTCPeerConnection;
        }
        if (!window2.RTCPeerConnection) {
          return;
        }
        if (browserDetails.version < 53) {
          ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
            var nativeMethod = window2.RTCPeerConnection.prototype[method];
            var methodObj = _defineProperty({}, method, function() {
              arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
              return nativeMethod.apply(this, arguments);
            });
            window2.RTCPeerConnection.prototype[method] = methodObj[method];
          });
        }
      }
      function fixNegotiationNeeded(window2, browserDetails) {
        utils.wrapPeerConnectionEvent(window2, "negotiationneeded", function(e) {
          var pc = e.target;
          if (browserDetails.version < 72 || pc.getConfiguration && pc.getConfiguration().sdpSemantics === "plan-b") {
            if (pc.signalingState !== "stable") {
              return;
            }
          }
          return e;
        });
      }
    }, { "../utils.js": 10, "./getusermedia": 4 }],
    4: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.shimGetUserMedia = shimGetUserMedia;
      var utils = _interopRequireWildcard(require2("../utils.js"));
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      var logging = utils.log;
      function shimGetUserMedia(window2, browserDetails) {
        var navigator2 = window2 && window2.navigator;
        if (!navigator2.mediaDevices) {
          return;
        }
        var constraintsToChrome_ = function constraintsToChrome_2(c) {
          if (_typeof(c) !== "object" || c.mandatory || c.optional) {
            return c;
          }
          var cc = {};
          Object.keys(c).forEach(function(key) {
            if (key === "require" || key === "advanced" || key === "mediaSource") {
              return;
            }
            var r = _typeof(c[key]) === "object" ? c[key] : {
              ideal: c[key]
            };
            if (r.exact !== void 0 && typeof r.exact === "number") {
              r.min = r.max = r.exact;
            }
            var oldname_ = function oldname_2(prefix, name) {
              if (prefix) {
                return prefix + name.charAt(0).toUpperCase() + name.slice(1);
              }
              return name === "deviceId" ? "sourceId" : name;
            };
            if (r.ideal !== void 0) {
              cc.optional = cc.optional || [];
              var oc = {};
              if (typeof r.ideal === "number") {
                oc[oldname_("min", key)] = r.ideal;
                cc.optional.push(oc);
                oc = {};
                oc[oldname_("max", key)] = r.ideal;
                cc.optional.push(oc);
              } else {
                oc[oldname_("", key)] = r.ideal;
                cc.optional.push(oc);
              }
            }
            if (r.exact !== void 0 && typeof r.exact !== "number") {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname_("", key)] = r.exact;
            } else {
              ["min", "max"].forEach(function(mix) {
                if (r[mix] !== void 0) {
                  cc.mandatory = cc.mandatory || {};
                  cc.mandatory[oldname_(mix, key)] = r[mix];
                }
              });
            }
          });
          if (c.advanced) {
            cc.optional = (cc.optional || []).concat(c.advanced);
          }
          return cc;
        };
        var shimConstraints_ = function shimConstraints_2(constraints, func) {
          if (browserDetails.version >= 61) {
            return func(constraints);
          }
          constraints = JSON.parse(JSON.stringify(constraints));
          if (constraints && _typeof(constraints.audio) === "object") {
            var remap2 = function remap22(obj, a, b) {
              if (a in obj && !(b in obj)) {
                obj[b] = obj[a];
                delete obj[a];
              }
            };
            constraints = JSON.parse(JSON.stringify(constraints));
            remap2(constraints.audio, "autoGainControl", "googAutoGainControl");
            remap2(constraints.audio, "noiseSuppression", "googNoiseSuppression");
            constraints.audio = constraintsToChrome_(constraints.audio);
          }
          if (constraints && _typeof(constraints.video) === "object") {
            var face = constraints.video.facingMode;
            face = face && (_typeof(face) === "object" ? face : {
              ideal: face
            });
            var getSupportedFacingModeLies = browserDetails.version < 66;
            if (face && (face.exact === "user" || face.exact === "environment" || face.ideal === "user" || face.ideal === "environment") && !(navigator2.mediaDevices.getSupportedConstraints && navigator2.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
              delete constraints.video.facingMode;
              var matches;
              if (face.exact === "environment" || face.ideal === "environment") {
                matches = ["back", "rear"];
              } else if (face.exact === "user" || face.ideal === "user") {
                matches = ["front"];
              }
              if (matches) {
                return navigator2.mediaDevices.enumerateDevices().then(function(devices) {
                  devices = devices.filter(function(d) {
                    return d.kind === "videoinput";
                  });
                  var dev = devices.find(function(d) {
                    return matches.some(function(match) {
                      return d.label.toLowerCase().includes(match);
                    });
                  });
                  if (!dev && devices.length && matches.includes("back")) {
                    dev = devices[devices.length - 1];
                  }
                  if (dev) {
                    constraints.video.deviceId = face.exact ? {
                      exact: dev.deviceId
                    } : {
                      ideal: dev.deviceId
                    };
                  }
                  constraints.video = constraintsToChrome_(constraints.video);
                  logging("chrome: " + JSON.stringify(constraints));
                  return func(constraints);
                });
              }
            }
            constraints.video = constraintsToChrome_(constraints.video);
          }
          logging("chrome: " + JSON.stringify(constraints));
          return func(constraints);
        };
        var shimError_ = function shimError_2(e) {
          if (browserDetails.version >= 64) {
            return e;
          }
          return {
            name: {
              PermissionDeniedError: "NotAllowedError",
              PermissionDismissedError: "NotAllowedError",
              InvalidStateError: "NotAllowedError",
              DevicesNotFoundError: "NotFoundError",
              ConstraintNotSatisfiedError: "OverconstrainedError",
              TrackStartError: "NotReadableError",
              MediaDeviceFailedDueToShutdown: "NotAllowedError",
              MediaDeviceKillSwitchOn: "NotAllowedError",
              TabCaptureError: "AbortError",
              ScreenCaptureError: "AbortError",
              DeviceCaptureError: "AbortError"
            }[e.name] || e.name,
            message: e.message,
            constraint: e.constraint || e.constraintName,
            toString: function toString() {
              return this.name + (this.message && ": ") + this.message;
            }
          };
        };
        var getUserMedia_ = function getUserMedia_2(constraints, onSuccess, onError) {
          shimConstraints_(constraints, function(c) {
            navigator2.webkitGetUserMedia(c, onSuccess, function(e) {
              if (onError) {
                onError(shimError_(e));
              }
            });
          });
        };
        navigator2.getUserMedia = getUserMedia_.bind(navigator2);
        if (navigator2.mediaDevices.getUserMedia) {
          var origGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
          navigator2.mediaDevices.getUserMedia = function(cs) {
            return shimConstraints_(cs, function(c) {
              return origGetUserMedia(c).then(function(stream) {
                if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
                  stream.getTracks().forEach(function(track) {
                    track.stop();
                  });
                  throw new DOMException("", "NotFoundError");
                }
                return stream;
              }, function(e) {
                return Promise.reject(shimError_(e));
              });
            });
          };
        }
      }
    }, { "../utils.js": 10 }],
    5: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.removeExtmapAllowMixed = removeExtmapAllowMixed;
      exports3.shimAddIceCandidateNullOrEmpty = shimAddIceCandidateNullOrEmpty;
      exports3.shimConnectionState = shimConnectionState;
      exports3.shimMaxMessageSize = shimMaxMessageSize;
      exports3.shimParameterlessSetLocalDescription = shimParameterlessSetLocalDescription;
      exports3.shimRTCIceCandidate = shimRTCIceCandidate;
      exports3.shimRTCIceCandidateRelayProtocol = shimRTCIceCandidateRelayProtocol;
      exports3.shimSendThrowTypeError = shimSendThrowTypeError;
      var _sdp = _interopRequireDefault(require2("sdp"));
      var utils = _interopRequireWildcard(require2("./utils"));
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { "default": obj };
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      function shimRTCIceCandidate(window2) {
        if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "foundation" in window2.RTCIceCandidate.prototype) {
          return;
        }
        var NativeRTCIceCandidate = window2.RTCIceCandidate;
        window2.RTCIceCandidate = function RTCIceCandidate(args) {
          if (_typeof(args) === "object" && args.candidate && args.candidate.indexOf("a=") === 0) {
            args = JSON.parse(JSON.stringify(args));
            args.candidate = args.candidate.substring(2);
          }
          if (args.candidate && args.candidate.length) {
            var nativeCandidate = new NativeRTCIceCandidate(args);
            var parsedCandidate = _sdp["default"].parseCandidate(args.candidate);
            for (var key in parsedCandidate) {
              if (!(key in nativeCandidate)) {
                Object.defineProperty(nativeCandidate, key, {
                  value: parsedCandidate[key]
                });
              }
            }
            nativeCandidate.toJSON = function toJSON() {
              return {
                candidate: nativeCandidate.candidate,
                sdpMid: nativeCandidate.sdpMid,
                sdpMLineIndex: nativeCandidate.sdpMLineIndex,
                usernameFragment: nativeCandidate.usernameFragment
              };
            };
            return nativeCandidate;
          }
          return new NativeRTCIceCandidate(args);
        };
        window2.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;
        utils.wrapPeerConnectionEvent(window2, "icecandidate", function(e) {
          if (e.candidate) {
            Object.defineProperty(e, "candidate", {
              value: new window2.RTCIceCandidate(e.candidate),
              writable: "false"
            });
          }
          return e;
        });
      }
      function shimRTCIceCandidateRelayProtocol(window2) {
        if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "relayProtocol" in window2.RTCIceCandidate.prototype) {
          return;
        }
        utils.wrapPeerConnectionEvent(window2, "icecandidate", function(e) {
          if (e.candidate) {
            var parsedCandidate = _sdp["default"].parseCandidate(e.candidate.candidate);
            if (parsedCandidate.type === "relay") {
              e.candidate.relayProtocol = {
                0: "tls",
                1: "tcp",
                2: "udp"
              }[parsedCandidate.priority >> 24];
            }
          }
          return e;
        });
      }
      function shimMaxMessageSize(window2, browserDetails) {
        if (!window2.RTCPeerConnection) {
          return;
        }
        if (!("sctp" in window2.RTCPeerConnection.prototype)) {
          Object.defineProperty(window2.RTCPeerConnection.prototype, "sctp", {
            get: function get() {
              return typeof this._sctp === "undefined" ? null : this._sctp;
            }
          });
        }
        var sctpInDescription = function sctpInDescription2(description) {
          if (!description || !description.sdp) {
            return false;
          }
          var sections = _sdp["default"].splitSections(description.sdp);
          sections.shift();
          return sections.some(function(mediaSection) {
            var mLine = _sdp["default"].parseMLine(mediaSection);
            return mLine && mLine.kind === "application" && mLine.protocol.indexOf("SCTP") !== -1;
          });
        };
        var getRemoteFirefoxVersion = function getRemoteFirefoxVersion2(description) {
          var match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
          if (match === null || match.length < 2) {
            return -1;
          }
          var version = parseInt(match[1], 10);
          return version !== version ? -1 : version;
        };
        var getCanSendMaxMessageSize = function getCanSendMaxMessageSize2(remoteIsFirefox) {
          var canSendMaxMessageSize = 65536;
          if (browserDetails.browser === "firefox") {
            if (browserDetails.version < 57) {
              if (remoteIsFirefox === -1) {
                canSendMaxMessageSize = 16384;
              } else {
                canSendMaxMessageSize = 2147483637;
              }
            } else if (browserDetails.version < 60) {
              canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
            } else {
              canSendMaxMessageSize = 2147483637;
            }
          }
          return canSendMaxMessageSize;
        };
        var getMaxMessageSize = function getMaxMessageSize2(description, remoteIsFirefox) {
          var maxMessageSize = 65536;
          if (browserDetails.browser === "firefox" && browserDetails.version === 57) {
            maxMessageSize = 65535;
          }
          var match = _sdp["default"].matchPrefix(description.sdp, "a=max-message-size:");
          if (match.length > 0) {
            maxMessageSize = parseInt(match[0].substring(19), 10);
          } else if (browserDetails.browser === "firefox" && remoteIsFirefox !== -1) {
            maxMessageSize = 2147483637;
          }
          return maxMessageSize;
        };
        var origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
        window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
          this._sctp = null;
          if (browserDetails.browser === "chrome" && browserDetails.version >= 76) {
            var _this$getConfiguratio = this.getConfiguration(), sdpSemantics = _this$getConfiguratio.sdpSemantics;
            if (sdpSemantics === "plan-b") {
              Object.defineProperty(this, "sctp", {
                get: function get() {
                  return typeof this._sctp === "undefined" ? null : this._sctp;
                },
                enumerable: true,
                configurable: true
              });
            }
          }
          if (sctpInDescription(arguments[0])) {
            var isFirefox = getRemoteFirefoxVersion(arguments[0]);
            var canSendMMS = getCanSendMaxMessageSize(isFirefox);
            var remoteMMS = getMaxMessageSize(arguments[0], isFirefox);
            var maxMessageSize;
            if (canSendMMS === 0 && remoteMMS === 0) {
              maxMessageSize = Number.POSITIVE_INFINITY;
            } else if (canSendMMS === 0 || remoteMMS === 0) {
              maxMessageSize = Math.max(canSendMMS, remoteMMS);
            } else {
              maxMessageSize = Math.min(canSendMMS, remoteMMS);
            }
            var sctp = {};
            Object.defineProperty(sctp, "maxMessageSize", {
              get: function get() {
                return maxMessageSize;
              }
            });
            this._sctp = sctp;
          }
          return origSetRemoteDescription.apply(this, arguments);
        };
      }
      function shimSendThrowTypeError(window2) {
        if (!(window2.RTCPeerConnection && "createDataChannel" in window2.RTCPeerConnection.prototype)) {
          return;
        }
        function wrapDcSend(dc, pc) {
          var origDataChannelSend = dc.send;
          dc.send = function send() {
            var data = arguments[0];
            var length = data.length || data.size || data.byteLength;
            if (dc.readyState === "open" && pc.sctp && length > pc.sctp.maxMessageSize) {
              throw new TypeError("Message too large (can send a maximum of " + pc.sctp.maxMessageSize + " bytes)");
            }
            return origDataChannelSend.apply(dc, arguments);
          };
        }
        var origCreateDataChannel = window2.RTCPeerConnection.prototype.createDataChannel;
        window2.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
          var dataChannel = origCreateDataChannel.apply(this, arguments);
          wrapDcSend(dataChannel, this);
          return dataChannel;
        };
        utils.wrapPeerConnectionEvent(window2, "datachannel", function(e) {
          wrapDcSend(e.channel, e.target);
          return e;
        });
      }
      function shimConnectionState(window2) {
        if (!window2.RTCPeerConnection || "connectionState" in window2.RTCPeerConnection.prototype) {
          return;
        }
        var proto = window2.RTCPeerConnection.prototype;
        Object.defineProperty(proto, "connectionState", {
          get: function get() {
            return {
              completed: "connected",
              checking: "connecting"
            }[this.iceConnectionState] || this.iceConnectionState;
          },
          enumerable: true,
          configurable: true
        });
        Object.defineProperty(proto, "onconnectionstatechange", {
          get: function get() {
            return this._onconnectionstatechange || null;
          },
          set: function set(cb) {
            if (this._onconnectionstatechange) {
              this.removeEventListener("connectionstatechange", this._onconnectionstatechange);
              delete this._onconnectionstatechange;
            }
            if (cb) {
              this.addEventListener("connectionstatechange", this._onconnectionstatechange = cb);
            }
          },
          enumerable: true,
          configurable: true
        });
        ["setLocalDescription", "setRemoteDescription"].forEach(function(method) {
          var origMethod = proto[method];
          proto[method] = function() {
            if (!this._connectionstatechangepoly) {
              this._connectionstatechangepoly = function(e) {
                var pc = e.target;
                if (pc._lastConnectionState !== pc.connectionState) {
                  pc._lastConnectionState = pc.connectionState;
                  var newEvent = new Event("connectionstatechange", e);
                  pc.dispatchEvent(newEvent);
                }
                return e;
              };
              this.addEventListener("iceconnectionstatechange", this._connectionstatechangepoly);
            }
            return origMethod.apply(this, arguments);
          };
        });
      }
      function removeExtmapAllowMixed(window2, browserDetails) {
        if (!window2.RTCPeerConnection) {
          return;
        }
        if (browserDetails.browser === "chrome" && browserDetails.version >= 71) {
          return;
        }
        if (browserDetails.browser === "safari" && browserDetails.version >= 605) {
          return;
        }
        var nativeSRD = window2.RTCPeerConnection.prototype.setRemoteDescription;
        window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
          if (desc && desc.sdp && desc.sdp.indexOf("\na=extmap-allow-mixed") !== -1) {
            var sdp = desc.sdp.split("\n").filter(function(line) {
              return line.trim() !== "a=extmap-allow-mixed";
            }).join("\n");
            if (window2.RTCSessionDescription && desc instanceof window2.RTCSessionDescription) {
              arguments[0] = new window2.RTCSessionDescription({
                type: desc.type,
                sdp
              });
            } else {
              desc.sdp = sdp;
            }
          }
          return nativeSRD.apply(this, arguments);
        };
      }
      function shimAddIceCandidateNullOrEmpty(window2, browserDetails) {
        if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) {
          return;
        }
        var nativeAddIceCandidate = window2.RTCPeerConnection.prototype.addIceCandidate;
        if (!nativeAddIceCandidate || nativeAddIceCandidate.length === 0) {
          return;
        }
        window2.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
          if (!arguments[0]) {
            if (arguments[1]) {
              arguments[1].apply(null);
            }
            return Promise.resolve();
          }
          if ((browserDetails.browser === "chrome" && browserDetails.version < 78 || browserDetails.browser === "firefox" && browserDetails.version < 68 || browserDetails.browser === "safari") && arguments[0] && arguments[0].candidate === "") {
            return Promise.resolve();
          }
          return nativeAddIceCandidate.apply(this, arguments);
        };
      }
      function shimParameterlessSetLocalDescription(window2, browserDetails) {
        if (!(window2.RTCPeerConnection && window2.RTCPeerConnection.prototype)) {
          return;
        }
        var nativeSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
        if (!nativeSetLocalDescription || nativeSetLocalDescription.length === 0) {
          return;
        }
        window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
          var _this = this;
          var desc = arguments[0] || {};
          if (_typeof(desc) !== "object" || desc.type && desc.sdp) {
            return nativeSetLocalDescription.apply(this, arguments);
          }
          desc = {
            type: desc.type,
            sdp: desc.sdp
          };
          if (!desc.type) {
            switch (this.signalingState) {
              case "stable":
              case "have-local-offer":
              case "have-remote-pranswer":
                desc.type = "offer";
                break;
              default:
                desc.type = "answer";
                break;
            }
          }
          if (desc.sdp || desc.type !== "offer" && desc.type !== "answer") {
            return nativeSetLocalDescription.apply(this, [desc]);
          }
          var func = desc.type === "offer" ? this.createOffer : this.createAnswer;
          return func.apply(this).then(function(d) {
            return nativeSetLocalDescription.apply(_this, [d]);
          });
        };
      }
    }, { "./utils": 10, "sdp": 11 }],
    6: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.shimAddTransceiver = shimAddTransceiver;
      exports3.shimCreateAnswer = shimCreateAnswer;
      exports3.shimCreateOffer = shimCreateOffer;
      Object.defineProperty(exports3, "shimGetDisplayMedia", {
        enumerable: true,
        get: function get() {
          return _getdisplaymedia.shimGetDisplayMedia;
        }
      });
      exports3.shimGetParameters = shimGetParameters;
      Object.defineProperty(exports3, "shimGetUserMedia", {
        enumerable: true,
        get: function get() {
          return _getusermedia.shimGetUserMedia;
        }
      });
      exports3.shimOnTrack = shimOnTrack;
      exports3.shimPeerConnection = shimPeerConnection;
      exports3.shimRTCDataChannel = shimRTCDataChannel;
      exports3.shimReceiverGetStats = shimReceiverGetStats;
      exports3.shimRemoveStream = shimRemoveStream;
      exports3.shimSenderGetStats = shimSenderGetStats;
      var utils = _interopRequireWildcard(require2("../utils"));
      var _getusermedia = require2("./getusermedia");
      var _getdisplaymedia = require2("./getdisplaymedia");
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
      }
      function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _iterableToArray(iter) {
        if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
      }
      function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr)) return _arrayLikeToArray(arr);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      function _defineProperty(obj, key, value) {
        key = _toPropertyKey(key);
        if (key in obj) {
          Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _toPropertyKey(t) {
        var i = _toPrimitive(t, "string");
        return "symbol" == _typeof(i) ? i : i + "";
      }
      function _toPrimitive(t, r) {
        if ("object" != _typeof(t) || !t) return t;
        var e = t[Symbol.toPrimitive];
        if (void 0 !== e) {
          var i = e.call(t, r);
          if ("object" != _typeof(i)) return i;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return ("string" === r ? String : Number)(t);
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      function shimOnTrack(window2) {
        if (_typeof(window2) === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
          Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
            get: function get() {
              return {
                receiver: this.receiver
              };
            }
          });
        }
      }
      function shimPeerConnection(window2, browserDetails) {
        if (_typeof(window2) !== "object" || !(window2.RTCPeerConnection || window2.mozRTCPeerConnection)) {
          return;
        }
        if (!window2.RTCPeerConnection && window2.mozRTCPeerConnection) {
          window2.RTCPeerConnection = window2.mozRTCPeerConnection;
        }
        if (browserDetails.version < 53) {
          ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
            var nativeMethod = window2.RTCPeerConnection.prototype[method];
            var methodObj = _defineProperty({}, method, function() {
              arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
              return nativeMethod.apply(this, arguments);
            });
            window2.RTCPeerConnection.prototype[method] = methodObj[method];
          });
        }
        var modernStatsTypes = {
          inboundrtp: "inbound-rtp",
          outboundrtp: "outbound-rtp",
          candidatepair: "candidate-pair",
          localcandidate: "local-candidate",
          remotecandidate: "remote-candidate"
        };
        var nativeGetStats = window2.RTCPeerConnection.prototype.getStats;
        window2.RTCPeerConnection.prototype.getStats = function getStats() {
          var _arguments = Array.prototype.slice.call(arguments), selector = _arguments[0], onSucc = _arguments[1], onErr = _arguments[2];
          return nativeGetStats.apply(this, [selector || null]).then(function(stats) {
            if (browserDetails.version < 53 && !onSucc) {
              try {
                stats.forEach(function(stat) {
                  stat.type = modernStatsTypes[stat.type] || stat.type;
                });
              } catch (e) {
                if (e.name !== "TypeError") {
                  throw e;
                }
                stats.forEach(function(stat, i) {
                  stats.set(i, Object.assign({}, stat, {
                    type: modernStatsTypes[stat.type] || stat.type
                  }));
                });
              }
            }
            return stats;
          }).then(onSucc, onErr);
        };
      }
      function shimSenderGetStats(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
          return;
        }
        if (window2.RTCRtpSender && "getStats" in window2.RTCRtpSender.prototype) {
          return;
        }
        var origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
        if (origGetSenders) {
          window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
            var _this = this;
            var senders = origGetSenders.apply(this, []);
            senders.forEach(function(sender) {
              return sender._pc = _this;
            });
            return senders;
          };
        }
        var origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
        if (origAddTrack) {
          window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
            var sender = origAddTrack.apply(this, arguments);
            sender._pc = this;
            return sender;
          };
        }
        window2.RTCRtpSender.prototype.getStats = function getStats() {
          return this.track ? this._pc.getStats(this.track) : Promise.resolve(/* @__PURE__ */ new Map());
        };
      }
      function shimReceiverGetStats(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
          return;
        }
        if (window2.RTCRtpSender && "getStats" in window2.RTCRtpReceiver.prototype) {
          return;
        }
        var origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
        if (origGetReceivers) {
          window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
            var _this2 = this;
            var receivers = origGetReceivers.apply(this, []);
            receivers.forEach(function(receiver) {
              return receiver._pc = _this2;
            });
            return receivers;
          };
        }
        utils.wrapPeerConnectionEvent(window2, "track", function(e) {
          e.receiver._pc = e.srcElement;
          return e;
        });
        window2.RTCRtpReceiver.prototype.getStats = function getStats() {
          return this._pc.getStats(this.track);
        };
      }
      function shimRemoveStream(window2) {
        if (!window2.RTCPeerConnection || "removeStream" in window2.RTCPeerConnection.prototype) {
          return;
        }
        window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
          var _this3 = this;
          utils.deprecated("removeStream", "removeTrack");
          this.getSenders().forEach(function(sender) {
            if (sender.track && stream.getTracks().includes(sender.track)) {
              _this3.removeTrack(sender);
            }
          });
        };
      }
      function shimRTCDataChannel(window2) {
        if (window2.DataChannel && !window2.RTCDataChannel) {
          window2.RTCDataChannel = window2.DataChannel;
        }
      }
      function shimAddTransceiver(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCPeerConnection)) {
          return;
        }
        var origAddTransceiver = window2.RTCPeerConnection.prototype.addTransceiver;
        if (origAddTransceiver) {
          window2.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
            this.setParametersPromises = [];
            var sendEncodings = arguments[1] && arguments[1].sendEncodings;
            if (sendEncodings === void 0) {
              sendEncodings = [];
            }
            sendEncodings = _toConsumableArray(sendEncodings);
            var shouldPerformCheck = sendEncodings.length > 0;
            if (shouldPerformCheck) {
              sendEncodings.forEach(function(encodingParam) {
                if ("rid" in encodingParam) {
                  var ridRegex = /^[a-z0-9]{0,16}$/i;
                  if (!ridRegex.test(encodingParam.rid)) {
                    throw new TypeError("Invalid RID value provided.");
                  }
                }
                if ("scaleResolutionDownBy" in encodingParam) {
                  if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1)) {
                    throw new RangeError("scale_resolution_down_by must be >= 1.0");
                  }
                }
                if ("maxFramerate" in encodingParam) {
                  if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
                    throw new RangeError("max_framerate must be >= 0.0");
                  }
                }
              });
            }
            var transceiver = origAddTransceiver.apply(this, arguments);
            if (shouldPerformCheck) {
              var sender = transceiver.sender;
              var params = sender.getParameters();
              if (!("encodings" in params) || // Avoid being fooled by patched getParameters() below.
              params.encodings.length === 1 && Object.keys(params.encodings[0]).length === 0) {
                params.encodings = sendEncodings;
                sender.sendEncodings = sendEncodings;
                this.setParametersPromises.push(sender.setParameters(params).then(function() {
                  delete sender.sendEncodings;
                })["catch"](function() {
                  delete sender.sendEncodings;
                }));
              }
            }
            return transceiver;
          };
        }
      }
      function shimGetParameters(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCRtpSender)) {
          return;
        }
        var origGetParameters = window2.RTCRtpSender.prototype.getParameters;
        if (origGetParameters) {
          window2.RTCRtpSender.prototype.getParameters = function getParameters() {
            var params = origGetParameters.apply(this, arguments);
            if (!("encodings" in params)) {
              params.encodings = [].concat(this.sendEncodings || [{}]);
            }
            return params;
          };
        }
      }
      function shimCreateOffer(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCPeerConnection)) {
          return;
        }
        var origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
        window2.RTCPeerConnection.prototype.createOffer = function createOffer() {
          var _arguments2 = arguments, _this4 = this;
          if (this.setParametersPromises && this.setParametersPromises.length) {
            return Promise.all(this.setParametersPromises).then(function() {
              return origCreateOffer.apply(_this4, _arguments2);
            })["finally"](function() {
              _this4.setParametersPromises = [];
            });
          }
          return origCreateOffer.apply(this, arguments);
        };
      }
      function shimCreateAnswer(window2) {
        if (!(_typeof(window2) === "object" && window2.RTCPeerConnection)) {
          return;
        }
        var origCreateAnswer = window2.RTCPeerConnection.prototype.createAnswer;
        window2.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
          var _arguments3 = arguments, _this5 = this;
          if (this.setParametersPromises && this.setParametersPromises.length) {
            return Promise.all(this.setParametersPromises).then(function() {
              return origCreateAnswer.apply(_this5, _arguments3);
            })["finally"](function() {
              _this5.setParametersPromises = [];
            });
          }
          return origCreateAnswer.apply(this, arguments);
        };
      }
    }, { "../utils": 10, "./getdisplaymedia": 7, "./getusermedia": 8 }],
    7: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.shimGetDisplayMedia = shimGetDisplayMedia;
      function shimGetDisplayMedia(window2, preferredMediaSource) {
        if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
          return;
        }
        if (!window2.navigator.mediaDevices) {
          return;
        }
        window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
          if (!(constraints && constraints.video)) {
            var err = new DOMException("getDisplayMedia without video constraints is undefined");
            err.name = "NotFoundError";
            err.code = 8;
            return Promise.reject(err);
          }
          if (constraints.video === true) {
            constraints.video = {
              mediaSource: preferredMediaSource
            };
          } else {
            constraints.video.mediaSource = preferredMediaSource;
          }
          return window2.navigator.mediaDevices.getUserMedia(constraints);
        };
      }
    }, {}],
    8: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.shimGetUserMedia = shimGetUserMedia;
      var utils = _interopRequireWildcard(require2("../utils"));
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      function shimGetUserMedia(window2, browserDetails) {
        var navigator2 = window2 && window2.navigator;
        var MediaStreamTrack2 = window2 && window2.MediaStreamTrack;
        navigator2.getUserMedia = function(constraints, onSuccess, onError) {
          utils.deprecated("navigator.getUserMedia", "navigator.mediaDevices.getUserMedia");
          navigator2.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
        };
        if (!(browserDetails.version > 55 && "autoGainControl" in navigator2.mediaDevices.getSupportedConstraints())) {
          var remap2 = function remap22(obj, a, b) {
            if (a in obj && !(b in obj)) {
              obj[b] = obj[a];
              delete obj[a];
            }
          };
          var nativeGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
          navigator2.mediaDevices.getUserMedia = function(c) {
            if (_typeof(c) === "object" && _typeof(c.audio) === "object") {
              c = JSON.parse(JSON.stringify(c));
              remap2(c.audio, "autoGainControl", "mozAutoGainControl");
              remap2(c.audio, "noiseSuppression", "mozNoiseSuppression");
            }
            return nativeGetUserMedia(c);
          };
          if (MediaStreamTrack2 && MediaStreamTrack2.prototype.getSettings) {
            var nativeGetSettings = MediaStreamTrack2.prototype.getSettings;
            MediaStreamTrack2.prototype.getSettings = function() {
              var obj = nativeGetSettings.apply(this, arguments);
              remap2(obj, "mozAutoGainControl", "autoGainControl");
              remap2(obj, "mozNoiseSuppression", "noiseSuppression");
              return obj;
            };
          }
          if (MediaStreamTrack2 && MediaStreamTrack2.prototype.applyConstraints) {
            var nativeApplyConstraints = MediaStreamTrack2.prototype.applyConstraints;
            MediaStreamTrack2.prototype.applyConstraints = function(c) {
              if (this.kind === "audio" && _typeof(c) === "object") {
                c = JSON.parse(JSON.stringify(c));
                remap2(c, "autoGainControl", "mozAutoGainControl");
                remap2(c, "noiseSuppression", "mozNoiseSuppression");
              }
              return nativeApplyConstraints.apply(this, [c]);
            };
          }
        }
      }
    }, { "../utils": 10 }],
    9: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.shimAudioContext = shimAudioContext;
      exports3.shimCallbacksAPI = shimCallbacksAPI;
      exports3.shimConstraints = shimConstraints;
      exports3.shimCreateOfferLegacy = shimCreateOfferLegacy;
      exports3.shimGetUserMedia = shimGetUserMedia;
      exports3.shimLocalStreamsAPI = shimLocalStreamsAPI;
      exports3.shimRTCIceServerUrls = shimRTCIceServerUrls;
      exports3.shimRemoteStreamsAPI = shimRemoteStreamsAPI;
      exports3.shimTrackEventTransceiver = shimTrackEventTransceiver;
      var utils = _interopRequireWildcard(require2("../utils"));
      function _getRequireWildcardCache(e) {
        if ("function" != typeof WeakMap) return null;
        var r = /* @__PURE__ */ new WeakMap(), t = /* @__PURE__ */ new WeakMap();
        return (_getRequireWildcardCache = function _getRequireWildcardCache2(e2) {
          return e2 ? t : r;
        })(e);
      }
      function _interopRequireWildcard(e, r) {
        if (e && e.__esModule) return e;
        if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e };
        var t = _getRequireWildcardCache(r);
        if (t && t.has(e)) return t.get(e);
        var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor;
        for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];
        }
        return n["default"] = e, t && t.set(e, n), n;
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      function shimLocalStreamsAPI(window2) {
        if (_typeof(window2) !== "object" || !window2.RTCPeerConnection) {
          return;
        }
        if (!("getLocalStreams" in window2.RTCPeerConnection.prototype)) {
          window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
            if (!this._localStreams) {
              this._localStreams = [];
            }
            return this._localStreams;
          };
        }
        if (!("addStream" in window2.RTCPeerConnection.prototype)) {
          var _addTrack = window2.RTCPeerConnection.prototype.addTrack;
          window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
            var _this = this;
            if (!this._localStreams) {
              this._localStreams = [];
            }
            if (!this._localStreams.includes(stream)) {
              this._localStreams.push(stream);
            }
            stream.getAudioTracks().forEach(function(track) {
              return _addTrack.call(_this, track, stream);
            });
            stream.getVideoTracks().forEach(function(track) {
              return _addTrack.call(_this, track, stream);
            });
          };
          window2.RTCPeerConnection.prototype.addTrack = function addTrack(track) {
            var _this2 = this;
            for (var _len = arguments.length, streams = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              streams[_key - 1] = arguments[_key];
            }
            if (streams) {
              streams.forEach(function(stream) {
                if (!_this2._localStreams) {
                  _this2._localStreams = [stream];
                } else if (!_this2._localStreams.includes(stream)) {
                  _this2._localStreams.push(stream);
                }
              });
            }
            return _addTrack.apply(this, arguments);
          };
        }
        if (!("removeStream" in window2.RTCPeerConnection.prototype)) {
          window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
            var _this3 = this;
            if (!this._localStreams) {
              this._localStreams = [];
            }
            var index = this._localStreams.indexOf(stream);
            if (index === -1) {
              return;
            }
            this._localStreams.splice(index, 1);
            var tracks = stream.getTracks();
            this.getSenders().forEach(function(sender) {
              if (tracks.includes(sender.track)) {
                _this3.removeTrack(sender);
              }
            });
          };
        }
      }
      function shimRemoteStreamsAPI(window2) {
        if (_typeof(window2) !== "object" || !window2.RTCPeerConnection) {
          return;
        }
        if (!("getRemoteStreams" in window2.RTCPeerConnection.prototype)) {
          window2.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
            return this._remoteStreams ? this._remoteStreams : [];
          };
        }
        if (!("onaddstream" in window2.RTCPeerConnection.prototype)) {
          Object.defineProperty(window2.RTCPeerConnection.prototype, "onaddstream", {
            get: function get() {
              return this._onaddstream;
            },
            set: function set(f) {
              var _this4 = this;
              if (this._onaddstream) {
                this.removeEventListener("addstream", this._onaddstream);
                this.removeEventListener("track", this._onaddstreampoly);
              }
              this.addEventListener("addstream", this._onaddstream = f);
              this.addEventListener("track", this._onaddstreampoly = function(e) {
                e.streams.forEach(function(stream) {
                  if (!_this4._remoteStreams) {
                    _this4._remoteStreams = [];
                  }
                  if (_this4._remoteStreams.includes(stream)) {
                    return;
                  }
                  _this4._remoteStreams.push(stream);
                  var event = new Event("addstream");
                  event.stream = stream;
                  _this4.dispatchEvent(event);
                });
              });
            }
          });
          var origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
          window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
            var pc = this;
            if (!this._onaddstreampoly) {
              this.addEventListener("track", this._onaddstreampoly = function(e) {
                e.streams.forEach(function(stream) {
                  if (!pc._remoteStreams) {
                    pc._remoteStreams = [];
                  }
                  if (pc._remoteStreams.indexOf(stream) >= 0) {
                    return;
                  }
                  pc._remoteStreams.push(stream);
                  var event = new Event("addstream");
                  event.stream = stream;
                  pc.dispatchEvent(event);
                });
              });
            }
            return origSetRemoteDescription.apply(pc, arguments);
          };
        }
      }
      function shimCallbacksAPI(window2) {
        if (_typeof(window2) !== "object" || !window2.RTCPeerConnection) {
          return;
        }
        var prototype = window2.RTCPeerConnection.prototype;
        var origCreateOffer = prototype.createOffer;
        var origCreateAnswer = prototype.createAnswer;
        var setLocalDescription = prototype.setLocalDescription;
        var setRemoteDescription = prototype.setRemoteDescription;
        var addIceCandidate = prototype.addIceCandidate;
        prototype.createOffer = function createOffer(successCallback, failureCallback) {
          var options = arguments.length >= 2 ? arguments[2] : arguments[0];
          var promise = origCreateOffer.apply(this, [options]);
          if (!failureCallback) {
            return promise;
          }
          promise.then(successCallback, failureCallback);
          return Promise.resolve();
        };
        prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
          var options = arguments.length >= 2 ? arguments[2] : arguments[0];
          var promise = origCreateAnswer.apply(this, [options]);
          if (!failureCallback) {
            return promise;
          }
          promise.then(successCallback, failureCallback);
          return Promise.resolve();
        };
        var withCallback = function withCallback2(description, successCallback, failureCallback) {
          var promise = setLocalDescription.apply(this, [description]);
          if (!failureCallback) {
            return promise;
          }
          promise.then(successCallback, failureCallback);
          return Promise.resolve();
        };
        prototype.setLocalDescription = withCallback;
        withCallback = function withCallback2(description, successCallback, failureCallback) {
          var promise = setRemoteDescription.apply(this, [description]);
          if (!failureCallback) {
            return promise;
          }
          promise.then(successCallback, failureCallback);
          return Promise.resolve();
        };
        prototype.setRemoteDescription = withCallback;
        withCallback = function withCallback2(candidate, successCallback, failureCallback) {
          var promise = addIceCandidate.apply(this, [candidate]);
          if (!failureCallback) {
            return promise;
          }
          promise.then(successCallback, failureCallback);
          return Promise.resolve();
        };
        prototype.addIceCandidate = withCallback;
      }
      function shimGetUserMedia(window2) {
        var navigator2 = window2 && window2.navigator;
        if (navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
          var mediaDevices = navigator2.mediaDevices;
          var _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
          navigator2.mediaDevices.getUserMedia = function(constraints) {
            return _getUserMedia(shimConstraints(constraints));
          };
        }
        if (!navigator2.getUserMedia && navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
          navigator2.getUserMedia = function getUserMedia(constraints, cb, errcb) {
            navigator2.mediaDevices.getUserMedia(constraints).then(cb, errcb);
          }.bind(navigator2);
        }
      }
      function shimConstraints(constraints) {
        if (constraints && constraints.video !== void 0) {
          return Object.assign({}, constraints, {
            video: utils.compactObject(constraints.video)
          });
        }
        return constraints;
      }
      function shimRTCIceServerUrls(window2) {
        if (!window2.RTCPeerConnection) {
          return;
        }
        var OrigPeerConnection = window2.RTCPeerConnection;
        window2.RTCPeerConnection = function RTCPeerConnection2(pcConfig, pcConstraints) {
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.urls === void 0 && server.url) {
                utils.deprecated("RTCIceServer.url", "RTCIceServer.urls");
                server = JSON.parse(JSON.stringify(server));
                server.urls = server.url;
                delete server.url;
                newIceServers.push(server);
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
          return new OrigPeerConnection(pcConfig, pcConstraints);
        };
        window2.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
        if ("generateCertificate" in OrigPeerConnection) {
          Object.defineProperty(window2.RTCPeerConnection, "generateCertificate", {
            get: function get() {
              return OrigPeerConnection.generateCertificate;
            }
          });
        }
      }
      function shimTrackEventTransceiver(window2) {
        if (_typeof(window2) === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
          Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
            get: function get() {
              return {
                receiver: this.receiver
              };
            }
          });
        }
      }
      function shimCreateOfferLegacy(window2) {
        var origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
        window2.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
          if (offerOptions) {
            if (typeof offerOptions.offerToReceiveAudio !== "undefined") {
              offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
            }
            var audioTransceiver = this.getTransceivers().find(function(transceiver) {
              return transceiver.receiver.track.kind === "audio";
            });
            if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
              if (audioTransceiver.direction === "sendrecv") {
                if (audioTransceiver.setDirection) {
                  audioTransceiver.setDirection("sendonly");
                } else {
                  audioTransceiver.direction = "sendonly";
                }
              } else if (audioTransceiver.direction === "recvonly") {
                if (audioTransceiver.setDirection) {
                  audioTransceiver.setDirection("inactive");
                } else {
                  audioTransceiver.direction = "inactive";
                }
              }
            } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
              this.addTransceiver("audio", {
                direction: "recvonly"
              });
            }
            if (typeof offerOptions.offerToReceiveVideo !== "undefined") {
              offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
            }
            var videoTransceiver = this.getTransceivers().find(function(transceiver) {
              return transceiver.receiver.track.kind === "video";
            });
            if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
              if (videoTransceiver.direction === "sendrecv") {
                if (videoTransceiver.setDirection) {
                  videoTransceiver.setDirection("sendonly");
                } else {
                  videoTransceiver.direction = "sendonly";
                }
              } else if (videoTransceiver.direction === "recvonly") {
                if (videoTransceiver.setDirection) {
                  videoTransceiver.setDirection("inactive");
                } else {
                  videoTransceiver.direction = "inactive";
                }
              }
            } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
              this.addTransceiver("video", {
                direction: "recvonly"
              });
            }
          }
          return origCreateOffer.apply(this, arguments);
        };
      }
      function shimAudioContext(window2) {
        if (_typeof(window2) !== "object" || window2.AudioContext) {
          return;
        }
        window2.AudioContext = window2.webkitAudioContext;
      }
    }, { "../utils": 10 }],
    10: [function(require2, module3, exports3) {
      Object.defineProperty(exports3, "__esModule", {
        value: true
      });
      exports3.compactObject = compactObject;
      exports3.deprecated = deprecated;
      exports3.detectBrowser = detectBrowser;
      exports3.disableLog = disableLog;
      exports3.disableWarnings = disableWarnings;
      exports3.extractVersion = extractVersion;
      exports3.filterStats = filterStats;
      exports3.log = log2;
      exports3.walkStats = walkStats;
      exports3.wrapPeerConnectionEvent = wrapPeerConnectionEvent;
      function _defineProperty(obj, key, value) {
        key = _toPropertyKey(key);
        if (key in obj) {
          Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _toPropertyKey(t) {
        var i = _toPrimitive(t, "string");
        return "symbol" == _typeof(i) ? i : i + "";
      }
      function _toPrimitive(t, r) {
        if ("object" != _typeof(t) || !t) return t;
        var e = t[Symbol.toPrimitive];
        if (void 0 !== e) {
          var i = e.call(t, r);
          if ("object" != _typeof(i)) return i;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return ("string" === r ? String : Number)(t);
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      var logDisabled_ = true;
      var deprecationWarnings_ = true;
      function extractVersion(uastring, expr, pos) {
        var match = uastring.match(expr);
        return match && match.length >= pos && parseInt(match[pos], 10);
      }
      function wrapPeerConnectionEvent(window2, eventNameToWrap, wrapper) {
        if (!window2.RTCPeerConnection) {
          return;
        }
        var proto = window2.RTCPeerConnection.prototype;
        var nativeAddEventListener = proto.addEventListener;
        proto.addEventListener = function(nativeEventName, cb) {
          if (nativeEventName !== eventNameToWrap) {
            return nativeAddEventListener.apply(this, arguments);
          }
          var wrappedCallback = function wrappedCallback2(e) {
            var modifiedEvent = wrapper(e);
            if (modifiedEvent) {
              if (cb.handleEvent) {
                cb.handleEvent(modifiedEvent);
              } else {
                cb(modifiedEvent);
              }
            }
          };
          this._eventMap = this._eventMap || {};
          if (!this._eventMap[eventNameToWrap]) {
            this._eventMap[eventNameToWrap] = /* @__PURE__ */ new Map();
          }
          this._eventMap[eventNameToWrap].set(cb, wrappedCallback);
          return nativeAddEventListener.apply(this, [nativeEventName, wrappedCallback]);
        };
        var nativeRemoveEventListener = proto.removeEventListener;
        proto.removeEventListener = function(nativeEventName, cb) {
          if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[eventNameToWrap]) {
            return nativeRemoveEventListener.apply(this, arguments);
          }
          if (!this._eventMap[eventNameToWrap].has(cb)) {
            return nativeRemoveEventListener.apply(this, arguments);
          }
          var unwrappedCb = this._eventMap[eventNameToWrap].get(cb);
          this._eventMap[eventNameToWrap]["delete"](cb);
          if (this._eventMap[eventNameToWrap].size === 0) {
            delete this._eventMap[eventNameToWrap];
          }
          if (Object.keys(this._eventMap).length === 0) {
            delete this._eventMap;
          }
          return nativeRemoveEventListener.apply(this, [nativeEventName, unwrappedCb]);
        };
        Object.defineProperty(proto, "on" + eventNameToWrap, {
          get: function get() {
            return this["_on" + eventNameToWrap];
          },
          set: function set(cb) {
            if (this["_on" + eventNameToWrap]) {
              this.removeEventListener(eventNameToWrap, this["_on" + eventNameToWrap]);
              delete this["_on" + eventNameToWrap];
            }
            if (cb) {
              this.addEventListener(eventNameToWrap, this["_on" + eventNameToWrap] = cb);
            }
          },
          enumerable: true,
          configurable: true
        });
      }
      function disableLog(bool) {
        if (typeof bool !== "boolean") {
          return new Error("Argument type: " + _typeof(bool) + ". Please use a boolean.");
        }
        logDisabled_ = bool;
        return bool ? "adapter.js logging disabled" : "adapter.js logging enabled";
      }
      function disableWarnings(bool) {
        if (typeof bool !== "boolean") {
          return new Error("Argument type: " + _typeof(bool) + ". Please use a boolean.");
        }
        deprecationWarnings_ = !bool;
        return "adapter.js deprecation warnings " + (bool ? "disabled" : "enabled");
      }
      function log2() {
        if ((typeof window === "undefined" ? "undefined" : _typeof(window)) === "object") {
          if (logDisabled_) {
            return;
          }
          if (typeof console !== "undefined" && typeof console.log === "function") {
            console.log.apply(console, arguments);
          }
        }
      }
      function deprecated(oldMethod, newMethod) {
        if (!deprecationWarnings_) {
          return;
        }
        console.warn(oldMethod + " is deprecated, please use " + newMethod + " instead.");
      }
      function detectBrowser(window2) {
        var result = {
          browser: null,
          version: null
        };
        if (typeof window2 === "undefined" || !window2.navigator || !window2.navigator.userAgent) {
          result.browser = "Not a browser.";
          return result;
        }
        var navigator2 = window2.navigator;
        if (navigator2.userAgentData && navigator2.userAgentData.brands) {
          var chromium = navigator2.userAgentData.brands.find(function(brand) {
            return brand.brand === "Chromium";
          });
          if (chromium) {
            return {
              browser: "chrome",
              version: parseInt(chromium.version, 10)
            };
          }
        }
        if (navigator2.mozGetUserMedia) {
          result.browser = "firefox";
          result.version = extractVersion(navigator2.userAgent, /Firefox\/(\d+)\./, 1);
        } else if (navigator2.webkitGetUserMedia || window2.isSecureContext === false && window2.webkitRTCPeerConnection) {
          result.browser = "chrome";
          result.version = extractVersion(navigator2.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
        } else if (window2.RTCPeerConnection && navigator2.userAgent.match(/AppleWebKit\/(\d+)\./)) {
          result.browser = "safari";
          result.version = extractVersion(navigator2.userAgent, /AppleWebKit\/(\d+)\./, 1);
          result.supportsUnifiedPlan = window2.RTCRtpTransceiver && "currentDirection" in window2.RTCRtpTransceiver.prototype;
        } else {
          result.browser = "Not a supported browser.";
          return result;
        }
        return result;
      }
      function isObject(val) {
        return Object.prototype.toString.call(val) === "[object Object]";
      }
      function compactObject(data) {
        if (!isObject(data)) {
          return data;
        }
        return Object.keys(data).reduce(function(accumulator, key) {
          var isObj = isObject(data[key]);
          var value = isObj ? compactObject(data[key]) : data[key];
          var isEmptyObject = isObj && !Object.keys(value).length;
          if (value === void 0 || isEmptyObject) {
            return accumulator;
          }
          return Object.assign(accumulator, _defineProperty({}, key, value));
        }, {});
      }
      function walkStats(stats, base, resultSet) {
        if (!base || resultSet.has(base.id)) {
          return;
        }
        resultSet.set(base.id, base);
        Object.keys(base).forEach(function(name) {
          if (name.endsWith("Id")) {
            walkStats(stats, stats.get(base[name]), resultSet);
          } else if (name.endsWith("Ids")) {
            base[name].forEach(function(id) {
              walkStats(stats, stats.get(id), resultSet);
            });
          }
        });
      }
      function filterStats(result, track, outbound) {
        var streamStatsType = outbound ? "outbound-rtp" : "inbound-rtp";
        var filteredResult = /* @__PURE__ */ new Map();
        if (track === null) {
          return filteredResult;
        }
        var trackStats = [];
        result.forEach(function(value) {
          if (value.type === "track" && value.trackIdentifier === track.id) {
            trackStats.push(value);
          }
        });
        trackStats.forEach(function(trackStat) {
          result.forEach(function(stats) {
            if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
              walkStats(result, stats, filteredResult);
            }
          });
        });
        return filteredResult;
      }
    }, {}],
    11: [function(require2, module3, exports3) {
      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
        return typeof obj;
      } : function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
      var SDPUtils = {};
      SDPUtils.generateIdentifier = function() {
        return Math.random().toString(36).substring(2, 12);
      };
      SDPUtils.localCName = SDPUtils.generateIdentifier();
      SDPUtils.splitLines = function(blob) {
        return blob.trim().split("\n").map(function(line) {
          return line.trim();
        });
      };
      SDPUtils.splitSections = function(blob) {
        var parts = blob.split("\nm=");
        return parts.map(function(part, index) {
          return (index > 0 ? "m=" + part : part).trim() + "\r\n";
        });
      };
      SDPUtils.getDescription = function(blob) {
        var sections = SDPUtils.splitSections(blob);
        return sections && sections[0];
      };
      SDPUtils.getMediaSections = function(blob) {
        var sections = SDPUtils.splitSections(blob);
        sections.shift();
        return sections;
      };
      SDPUtils.matchPrefix = function(blob, prefix) {
        return SDPUtils.splitLines(blob).filter(function(line) {
          return line.indexOf(prefix) === 0;
        });
      };
      SDPUtils.parseCandidate = function(line) {
        var parts = void 0;
        if (line.indexOf("a=candidate:") === 0) {
          parts = line.substring(12).split(" ");
        } else {
          parts = line.substring(10).split(" ");
        }
        var candidate = {
          foundation: parts[0],
          component: { 1: "rtp", 2: "rtcp" }[parts[1]] || parts[1],
          protocol: parts[2].toLowerCase(),
          priority: parseInt(parts[3], 10),
          ip: parts[4],
          address: parts[4],
          // address is an alias for ip.
          port: parseInt(parts[5], 10),
          // skip parts[6] == 'typ'
          type: parts[7]
        };
        for (var i = 8; i < parts.length; i += 2) {
          switch (parts[i]) {
            case "raddr":
              candidate.relatedAddress = parts[i + 1];
              break;
            case "rport":
              candidate.relatedPort = parseInt(parts[i + 1], 10);
              break;
            case "tcptype":
              candidate.tcpType = parts[i + 1];
              break;
            case "ufrag":
              candidate.ufrag = parts[i + 1];
              candidate.usernameFragment = parts[i + 1];
              break;
            default:
              if (candidate[parts[i]] === void 0) {
                candidate[parts[i]] = parts[i + 1];
              }
              break;
          }
        }
        return candidate;
      };
      SDPUtils.writeCandidate = function(candidate) {
        var sdp = [];
        sdp.push(candidate.foundation);
        var component = candidate.component;
        if (component === "rtp") {
          sdp.push(1);
        } else if (component === "rtcp") {
          sdp.push(2);
        } else {
          sdp.push(component);
        }
        sdp.push(candidate.protocol.toUpperCase());
        sdp.push(candidate.priority);
        sdp.push(candidate.address || candidate.ip);
        sdp.push(candidate.port);
        var type = candidate.type;
        sdp.push("typ");
        sdp.push(type);
        if (type !== "host" && candidate.relatedAddress && candidate.relatedPort) {
          sdp.push("raddr");
          sdp.push(candidate.relatedAddress);
          sdp.push("rport");
          sdp.push(candidate.relatedPort);
        }
        if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
          sdp.push("tcptype");
          sdp.push(candidate.tcpType);
        }
        if (candidate.usernameFragment || candidate.ufrag) {
          sdp.push("ufrag");
          sdp.push(candidate.usernameFragment || candidate.ufrag);
        }
        return "candidate:" + sdp.join(" ");
      };
      SDPUtils.parseIceOptions = function(line) {
        return line.substring(14).split(" ");
      };
      SDPUtils.parseRtpMap = function(line) {
        var parts = line.substring(9).split(" ");
        var parsed = {
          payloadType: parseInt(parts.shift(), 10)
          // was: id
        };
        parts = parts[0].split("/");
        parsed.name = parts[0];
        parsed.clockRate = parseInt(parts[1], 10);
        parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
        parsed.numChannels = parsed.channels;
        return parsed;
      };
      SDPUtils.writeRtpMap = function(codec) {
        var pt = codec.payloadType;
        if (codec.preferredPayloadType !== void 0) {
          pt = codec.preferredPayloadType;
        }
        var channels = codec.channels || codec.numChannels || 1;
        return "a=rtpmap:" + pt + " " + codec.name + "/" + codec.clockRate + (channels !== 1 ? "/" + channels : "") + "\r\n";
      };
      SDPUtils.parseExtmap = function(line) {
        var parts = line.substring(9).split(" ");
        return {
          id: parseInt(parts[0], 10),
          direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv",
          uri: parts[1],
          attributes: parts.slice(2).join(" ")
        };
      };
      SDPUtils.writeExtmap = function(headerExtension) {
        return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + (headerExtension.attributes ? " " + headerExtension.attributes : "") + "\r\n";
      };
      SDPUtils.parseFmtp = function(line) {
        var parsed = {};
        var kv = void 0;
        var parts = line.substring(line.indexOf(" ") + 1).split(";");
        for (var j = 0; j < parts.length; j++) {
          kv = parts[j].trim().split("=");
          parsed[kv[0].trim()] = kv[1];
        }
        return parsed;
      };
      SDPUtils.writeFmtp = function(codec) {
        var line = "";
        var pt = codec.payloadType;
        if (codec.preferredPayloadType !== void 0) {
          pt = codec.preferredPayloadType;
        }
        if (codec.parameters && Object.keys(codec.parameters).length) {
          var params = [];
          Object.keys(codec.parameters).forEach(function(param) {
            if (codec.parameters[param] !== void 0) {
              params.push(param + "=" + codec.parameters[param]);
            } else {
              params.push(param);
            }
          });
          line += "a=fmtp:" + pt + " " + params.join(";") + "\r\n";
        }
        return line;
      };
      SDPUtils.parseRtcpFb = function(line) {
        var parts = line.substring(line.indexOf(" ") + 1).split(" ");
        return {
          type: parts.shift(),
          parameter: parts.join(" ")
        };
      };
      SDPUtils.writeRtcpFb = function(codec) {
        var lines = "";
        var pt = codec.payloadType;
        if (codec.preferredPayloadType !== void 0) {
          pt = codec.preferredPayloadType;
        }
        if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
          codec.rtcpFeedback.forEach(function(fb) {
            lines += "a=rtcp-fb:" + pt + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
          });
        }
        return lines;
      };
      SDPUtils.parseSsrcMedia = function(line) {
        var sp = line.indexOf(" ");
        var parts = {
          ssrc: parseInt(line.substring(7, sp), 10)
        };
        var colon = line.indexOf(":", sp);
        if (colon > -1) {
          parts.attribute = line.substring(sp + 1, colon);
          parts.value = line.substring(colon + 1);
        } else {
          parts.attribute = line.substring(sp + 1);
        }
        return parts;
      };
      SDPUtils.parseSsrcGroup = function(line) {
        var parts = line.substring(13).split(" ");
        return {
          semantics: parts.shift(),
          ssrcs: parts.map(function(ssrc) {
            return parseInt(ssrc, 10);
          })
        };
      };
      SDPUtils.getMid = function(mediaSection) {
        var mid = SDPUtils.matchPrefix(mediaSection, "a=mid:")[0];
        if (mid) {
          return mid.substring(6);
        }
      };
      SDPUtils.parseFingerprint = function(line) {
        var parts = line.substring(14).split(" ");
        return {
          algorithm: parts[0].toLowerCase(),
          // algorithm is case-sensitive in Edge.
          value: parts[1].toUpperCase()
          // the definition is upper-case in RFC 4572.
        };
      };
      SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
        var lines = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=fingerprint:");
        return {
          role: "auto",
          fingerprints: lines.map(SDPUtils.parseFingerprint)
        };
      };
      SDPUtils.writeDtlsParameters = function(params, setupType) {
        var sdp = "a=setup:" + setupType + "\r\n";
        params.fingerprints.forEach(function(fp) {
          sdp += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
        });
        return sdp;
      };
      SDPUtils.parseCryptoLine = function(line) {
        var parts = line.substring(9).split(" ");
        return {
          tag: parseInt(parts[0], 10),
          cryptoSuite: parts[1],
          keyParams: parts[2],
          sessionParams: parts.slice(3)
        };
      };
      SDPUtils.writeCryptoLine = function(parameters) {
        return "a=crypto:" + parameters.tag + " " + parameters.cryptoSuite + " " + (_typeof(parameters.keyParams) === "object" ? SDPUtils.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? " " + parameters.sessionParams.join(" ") : "") + "\r\n";
      };
      SDPUtils.parseCryptoKeyParams = function(keyParams) {
        if (keyParams.indexOf("inline:") !== 0) {
          return null;
        }
        var parts = keyParams.substring(7).split("|");
        return {
          keyMethod: "inline",
          keySalt: parts[0],
          lifeTime: parts[1],
          mkiValue: parts[2] ? parts[2].split(":")[0] : void 0,
          mkiLength: parts[2] ? parts[2].split(":")[1] : void 0
        };
      };
      SDPUtils.writeCryptoKeyParams = function(keyParams) {
        return keyParams.keyMethod + ":" + keyParams.keySalt + (keyParams.lifeTime ? "|" + keyParams.lifeTime : "") + (keyParams.mkiValue && keyParams.mkiLength ? "|" + keyParams.mkiValue + ":" + keyParams.mkiLength : "");
      };
      SDPUtils.getCryptoParameters = function(mediaSection, sessionpart) {
        var lines = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=crypto:");
        return lines.map(SDPUtils.parseCryptoLine);
      };
      SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
        var ufrag = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=ice-ufrag:")[0];
        var pwd = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=ice-pwd:")[0];
        if (!(ufrag && pwd)) {
          return null;
        }
        return {
          usernameFragment: ufrag.substring(12),
          password: pwd.substring(10)
        };
      };
      SDPUtils.writeIceParameters = function(params) {
        var sdp = "a=ice-ufrag:" + params.usernameFragment + "\r\na=ice-pwd:" + params.password + "\r\n";
        if (params.iceLite) {
          sdp += "a=ice-lite\r\n";
        }
        return sdp;
      };
      SDPUtils.parseRtpParameters = function(mediaSection) {
        var description = {
          codecs: [],
          headerExtensions: [],
          fecMechanisms: [],
          rtcp: []
        };
        var lines = SDPUtils.splitLines(mediaSection);
        var mline = lines[0].split(" ");
        description.profile = mline[2];
        for (var i = 3; i < mline.length; i++) {
          var pt = mline[i];
          var rtpmapline = SDPUtils.matchPrefix(mediaSection, "a=rtpmap:" + pt + " ")[0];
          if (rtpmapline) {
            var codec = SDPUtils.parseRtpMap(rtpmapline);
            var fmtps = SDPUtils.matchPrefix(mediaSection, "a=fmtp:" + pt + " ");
            codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
            codec.rtcpFeedback = SDPUtils.matchPrefix(mediaSection, "a=rtcp-fb:" + pt + " ").map(SDPUtils.parseRtcpFb);
            description.codecs.push(codec);
            switch (codec.name.toUpperCase()) {
              case "RED":
              case "ULPFEC":
                description.fecMechanisms.push(codec.name.toUpperCase());
                break;
            }
          }
        }
        SDPUtils.matchPrefix(mediaSection, "a=extmap:").forEach(function(line) {
          description.headerExtensions.push(SDPUtils.parseExtmap(line));
        });
        var wildcardRtcpFb = SDPUtils.matchPrefix(mediaSection, "a=rtcp-fb:* ").map(SDPUtils.parseRtcpFb);
        description.codecs.forEach(function(codec2) {
          wildcardRtcpFb.forEach(function(fb) {
            var duplicate = codec2.rtcpFeedback.find(function(existingFeedback) {
              return existingFeedback.type === fb.type && existingFeedback.parameter === fb.parameter;
            });
            if (!duplicate) {
              codec2.rtcpFeedback.push(fb);
            }
          });
        });
        return description;
      };
      SDPUtils.writeRtpDescription = function(kind, caps) {
        var sdp = "";
        sdp += "m=" + kind + " ";
        sdp += caps.codecs.length > 0 ? "9" : "0";
        sdp += " " + (caps.profile || "UDP/TLS/RTP/SAVPF") + " ";
        sdp += caps.codecs.map(function(codec) {
          if (codec.preferredPayloadType !== void 0) {
            return codec.preferredPayloadType;
          }
          return codec.payloadType;
        }).join(" ") + "\r\n";
        sdp += "c=IN IP4 0.0.0.0\r\n";
        sdp += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
        caps.codecs.forEach(function(codec) {
          sdp += SDPUtils.writeRtpMap(codec);
          sdp += SDPUtils.writeFmtp(codec);
          sdp += SDPUtils.writeRtcpFb(codec);
        });
        var maxptime = 0;
        caps.codecs.forEach(function(codec) {
          if (codec.maxptime > maxptime) {
            maxptime = codec.maxptime;
          }
        });
        if (maxptime > 0) {
          sdp += "a=maxptime:" + maxptime + "\r\n";
        }
        if (caps.headerExtensions) {
          caps.headerExtensions.forEach(function(extension) {
            sdp += SDPUtils.writeExtmap(extension);
          });
        }
        return sdp;
      };
      SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
        var encodingParameters = [];
        var description = SDPUtils.parseRtpParameters(mediaSection);
        var hasRed = description.fecMechanisms.indexOf("RED") !== -1;
        var hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
        var ssrcs = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function(line) {
          return SDPUtils.parseSsrcMedia(line);
        }).filter(function(parts) {
          return parts.attribute === "cname";
        });
        var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
        var secondarySsrc = void 0;
        var flows = SDPUtils.matchPrefix(mediaSection, "a=ssrc-group:FID").map(function(line) {
          var parts = line.substring(17).split(" ");
          return parts.map(function(part) {
            return parseInt(part, 10);
          });
        });
        if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
          secondarySsrc = flows[0][1];
        }
        description.codecs.forEach(function(codec) {
          if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
            var encParam = {
              ssrc: primarySsrc,
              codecPayloadType: parseInt(codec.parameters.apt, 10)
            };
            if (primarySsrc && secondarySsrc) {
              encParam.rtx = { ssrc: secondarySsrc };
            }
            encodingParameters.push(encParam);
            if (hasRed) {
              encParam = JSON.parse(JSON.stringify(encParam));
              encParam.fec = {
                ssrc: primarySsrc,
                mechanism: hasUlpfec ? "red+ulpfec" : "red"
              };
              encodingParameters.push(encParam);
            }
          }
        });
        if (encodingParameters.length === 0 && primarySsrc) {
          encodingParameters.push({
            ssrc: primarySsrc
          });
        }
        var bandwidth = SDPUtils.matchPrefix(mediaSection, "b=");
        if (bandwidth.length) {
          if (bandwidth[0].indexOf("b=TIAS:") === 0) {
            bandwidth = parseInt(bandwidth[0].substring(7), 10);
          } else if (bandwidth[0].indexOf("b=AS:") === 0) {
            bandwidth = parseInt(bandwidth[0].substring(5), 10) * 1e3 * 0.95 - 50 * 40 * 8;
          } else {
            bandwidth = void 0;
          }
          encodingParameters.forEach(function(params) {
            params.maxBitrate = bandwidth;
          });
        }
        return encodingParameters;
      };
      SDPUtils.parseRtcpParameters = function(mediaSection) {
        var rtcpParameters = {};
        var remoteSsrc = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function(line) {
          return SDPUtils.parseSsrcMedia(line);
        }).filter(function(obj) {
          return obj.attribute === "cname";
        })[0];
        if (remoteSsrc) {
          rtcpParameters.cname = remoteSsrc.value;
          rtcpParameters.ssrc = remoteSsrc.ssrc;
        }
        var rsize = SDPUtils.matchPrefix(mediaSection, "a=rtcp-rsize");
        rtcpParameters.reducedSize = rsize.length > 0;
        rtcpParameters.compound = rsize.length === 0;
        var mux = SDPUtils.matchPrefix(mediaSection, "a=rtcp-mux");
        rtcpParameters.mux = mux.length > 0;
        return rtcpParameters;
      };
      SDPUtils.writeRtcpParameters = function(rtcpParameters) {
        var sdp = "";
        if (rtcpParameters.reducedSize) {
          sdp += "a=rtcp-rsize\r\n";
        }
        if (rtcpParameters.mux) {
          sdp += "a=rtcp-mux\r\n";
        }
        if (rtcpParameters.ssrc !== void 0 && rtcpParameters.cname) {
          sdp += "a=ssrc:" + rtcpParameters.ssrc + " cname:" + rtcpParameters.cname + "\r\n";
        }
        return sdp;
      };
      SDPUtils.parseMsid = function(mediaSection) {
        var parts = void 0;
        var spec = SDPUtils.matchPrefix(mediaSection, "a=msid:");
        if (spec.length === 1) {
          parts = spec[0].substring(7).split(" ");
          return { stream: parts[0], track: parts[1] };
        }
        var planB = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function(line) {
          return SDPUtils.parseSsrcMedia(line);
        }).filter(function(msidParts) {
          return msidParts.attribute === "msid";
        });
        if (planB.length > 0) {
          parts = planB[0].value.split(" ");
          return { stream: parts[0], track: parts[1] };
        }
      };
      SDPUtils.parseSctpDescription = function(mediaSection) {
        var mline = SDPUtils.parseMLine(mediaSection);
        var maxSizeLine = SDPUtils.matchPrefix(mediaSection, "a=max-message-size:");
        var maxMessageSize = void 0;
        if (maxSizeLine.length > 0) {
          maxMessageSize = parseInt(maxSizeLine[0].substring(19), 10);
        }
        if (isNaN(maxMessageSize)) {
          maxMessageSize = 65536;
        }
        var sctpPort = SDPUtils.matchPrefix(mediaSection, "a=sctp-port:");
        if (sctpPort.length > 0) {
          return {
            port: parseInt(sctpPort[0].substring(12), 10),
            protocol: mline.fmt,
            maxMessageSize
          };
        }
        var sctpMapLines = SDPUtils.matchPrefix(mediaSection, "a=sctpmap:");
        if (sctpMapLines.length > 0) {
          var parts = sctpMapLines[0].substring(10).split(" ");
          return {
            port: parseInt(parts[0], 10),
            protocol: parts[1],
            maxMessageSize
          };
        }
      };
      SDPUtils.writeSctpDescription = function(media, sctp) {
        var output = [];
        if (media.protocol !== "DTLS/SCTP") {
          output = ["m=" + media.kind + " 9 " + media.protocol + " " + sctp.protocol + "\r\n", "c=IN IP4 0.0.0.0\r\n", "a=sctp-port:" + sctp.port + "\r\n"];
        } else {
          output = ["m=" + media.kind + " 9 " + media.protocol + " " + sctp.port + "\r\n", "c=IN IP4 0.0.0.0\r\n", "a=sctpmap:" + sctp.port + " " + sctp.protocol + " 65535\r\n"];
        }
        if (sctp.maxMessageSize !== void 0) {
          output.push("a=max-message-size:" + sctp.maxMessageSize + "\r\n");
        }
        return output.join("");
      };
      SDPUtils.generateSessionId = function() {
        return Math.random().toString().substr(2, 22);
      };
      SDPUtils.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
        var sessionId = void 0;
        var version = sessVer !== void 0 ? sessVer : 2;
        if (sessId) {
          sessionId = sessId;
        } else {
          sessionId = SDPUtils.generateSessionId();
        }
        var user = sessUser || "thisisadapterortc";
        return "v=0\r\no=" + user + " " + sessionId + " " + version + " IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n";
      };
      SDPUtils.getDirection = function(mediaSection, sessionpart) {
        var lines = SDPUtils.splitLines(mediaSection);
        for (var i = 0; i < lines.length; i++) {
          switch (lines[i]) {
            case "a=sendrecv":
            case "a=sendonly":
            case "a=recvonly":
            case "a=inactive":
              return lines[i].substring(2);
          }
        }
        if (sessionpart) {
          return SDPUtils.getDirection(sessionpart);
        }
        return "sendrecv";
      };
      SDPUtils.getKind = function(mediaSection) {
        var lines = SDPUtils.splitLines(mediaSection);
        var mline = lines[0].split(" ");
        return mline[0].substring(2);
      };
      SDPUtils.isRejected = function(mediaSection) {
        return mediaSection.split(" ", 2)[1] === "0";
      };
      SDPUtils.parseMLine = function(mediaSection) {
        var lines = SDPUtils.splitLines(mediaSection);
        var parts = lines[0].substring(2).split(" ");
        return {
          kind: parts[0],
          port: parseInt(parts[1], 10),
          protocol: parts[2],
          fmt: parts.slice(3).join(" ")
        };
      };
      SDPUtils.parseOLine = function(mediaSection) {
        var line = SDPUtils.matchPrefix(mediaSection, "o=")[0];
        var parts = line.substring(2).split(" ");
        return {
          username: parts[0],
          sessionId: parts[1],
          sessionVersion: parseInt(parts[2], 10),
          netType: parts[3],
          addressType: parts[4],
          address: parts[5]
        };
      };
      SDPUtils.isValidSDP = function(blob) {
        if (typeof blob !== "string" || blob.length === 0) {
          return false;
        }
        var lines = SDPUtils.splitLines(blob);
        for (var i = 0; i < lines.length; i++) {
          if (lines[i].length < 2 || lines[i].charAt(1) !== "=") {
            return false;
          }
        }
        return true;
      };
      if ((typeof module3 === "undefined" ? "undefined" : _typeof(module3)) === "object") {
        module3.exports = SDPUtils;
      }
    }, {}]
  }, {}, [1])(1);
});
const JANUS_ERROR_TO_JANUS_ENUM_MAP = /* @__PURE__ */ new Map([
  [
    "Library not initialized",
    "LIB_NOT_INIT"
    /* LIB_NOT_INIT */
  ],
  [
    "WebRTC not supported by this browser",
    "WEBRTC_NOT_SUPPORTED"
    /* WEBRTC_NOT_SUPPORTED */
  ],
  [
    "Invalid server url",
    "INVALID_SERVER_URL"
    /* INVALID_SERVER_URL */
  ],
  ["Lost connection to the server (is it down?)LOST_CONNECTION_TO_SERVER"],
  [
    "Error connecting to any of the provided Janus servers: Is the server down?",
    "ERROR_CONNECT_TO_ANY_PROVIDE_JANUS"
    /* ERROR_CONNECT_TO_ANY_PROVIDE_JANUS */
  ],
  [
    "Error connecting to the Janus WebSockets server: Is the server down?",
    "ERROR_CONNECT_TO_JANUS_SERVER_DOWN"
    /* ERROR_CONNECT_TO_JANUS_SERVER_DOWN */
  ],
  [
    "Failed to destroy the server: Is the server down?",
    "FAILED_DESTROY"
    /* FAILED_DESTROY */
  ],
  [
    "Invalid plugin",
    "INVALID_PLUGIN"
    /* INVALID_PLUGIN */
  ],
  [
    "Unknown error",
    "UNKNOWN_ERROR"
    /* UNKNOWN_ERROR */
  ],
  [
    "Invalid data",
    "INVALID_DATA"
    /* INVALID_DATA */
  ],
  [
    "Invalid DTMF configuration (no audio track)",
    "INVALID_DTMF_NO_AUDIO"
    /* INVALID_DTMF_NO_AUDIO */
  ],
  [
    "Invalid DTMF configuration",
    "INVALID_DTMF"
    /* INVALID_DTMF */
  ],
  [
    "Invalid DTMF parameters",
    "INVALID_DTMF_PARAM"
    /* INVALID_DTMF_PARAM */
  ],
  [
    "Invalid DTMF string",
    "INVALID_DTMF_STRING"
    /* INVALID_DTMF_STRING */
  ],
  [
    "Is the server down? (connected=false)",
    "IS_THE_SERVER_DOWN_CONNECT_FALSE"
    /* IS_THE_SERVER_DOWN_CONNECT_FALSE */
  ],
  [
    "Provided a JSEP to a createOffer",
    "PROVIDE_JSEP_TO_OFFER"
    /* PROVIDE_JSEP_TO_OFFER */
  ],
  [
    "A valid JSEP is required for createAnswer",
    "JSEP_REQUIRED"
    /* JSEP_REQUIRED */
  ],
  [
    "Can't add audio stream, there already is one",
    "AUDIO_STREAM_EXISTS"
    /* AUDIO_STREAM_EXISTS */
  ],
  [
    "Can't add video stream, there already is one",
    "VIDEO_STREAM_EXISTS"
    /* VIDEO_STREAM_EXISTS */
  ],
  [
    "getUserMedia not available",
    "GET_USER_MEDIA_NOT_AVAILABLE"
    /* GET_USER_MEDIA_NOT_AVAILABLE */
  ],
  [
    "No capture device found",
    "NO_CAPTURE_DEVICE"
    /* NO_CAPTURE_DEVICE */
  ],
  [
    "Audio capture is required, but no capture device found",
    "AUDIO_CAPTURE_REQUIRED"
    /* AUDIO_CAPTURE_REQUIRED */
  ],
  [
    "Video capture is required, but no capture device found",
    "VIDEO_CAPTURE_REQUIRED"
    /* VIDEO_CAPTURE_REQUIRED */
  ],
  [
    "No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep",
    "NO_PEER_CONNECTION"
    /* NO_PEER_CONNECTION */
  ],
  [
    "Invalid JSEP",
    "INVALID_JSEP"
    /* INVALID_JSEP */
  ],
  [
    "Invalid handle",
    "INVALID_HANDLE"
    /* INVALID_HANDLE */
  ]
]);
var Janus = (function(factory) {
  if (typeof define === "function" && define.amd) {
    define(factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return factory();
  } else if (typeof window === "object") {
    return factory();
  }
})(function() {
  Janus2.sessions = /* @__PURE__ */ new Map();
  Janus2.isExtensionEnabled = function() {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      return true;
    }
    if (window.navigator.userAgent.match("Chrome")) {
      let chromever = parseInt(window.navigator.userAgent.match(/Chrome\/(.*) /)[1], 10);
      let maxver = 33;
      if (window.navigator.userAgent.match("Linux"))
        maxver = 35;
      if (chromever >= 26 && chromever <= maxver) {
        return true;
      }
      return Janus2.extension.isInstalled();
    } else {
      return true;
    }
  };
  var defaultExtension = {
    // Screensharing Chrome Extension ID
    extensionId: "hapfgfdkleiggjjpfpenajgdnfckjpaj",
    isInstalled: function() {
      return document.querySelector("#janus-extension-installed") !== null;
    },
    getScreen: function(callback) {
      let pending = window.setTimeout(function() {
        let error = new Error("NavigatorUserMediaError");
        error.name = 'The required Chrome extension is not installed: click <a href="#">here</a> to install it. (NOTE: this will need you to refresh the page)';
        return callback(error);
      }, 1e3);
      this.cache[pending] = callback;
      window.postMessage({ type: "janusGetScreen", id: pending }, "*");
    },
    init: function() {
      let cache = {};
      this.cache = cache;
      window.addEventListener("message", function(event) {
        if (event.origin != window.location.origin)
          return;
        if (event.data.type == "janusGotScreen" && cache[event.data.id]) {
          let callback = cache[event.data.id];
          delete cache[event.data.id];
          if (event.data.sourceId === "") {
            let error = new Error("NavigatorUserMediaError");
            error.name = "You cancelled the request for permission, giving up...";
            callback(error);
          } else {
            callback(null, event.data.sourceId);
          }
        } else if (event.data.type == "janusGetScreenPending") {
          console.log("clearing ", event.data.id);
          window.clearTimeout(event.data.id);
        }
      });
    }
  };
  Janus2.useDefaultDependencies = function(deps) {
    let f = deps && deps.fetch || fetch;
    let p = deps && deps.Promise || Promise;
    let socketCls = deps && deps.WebSocket || WebSocket;
    return {
      newWebSocket: function(server, proto) {
        return new socketCls(server, proto);
      },
      extension: deps && deps.extension || defaultExtension,
      isArray: function(arr) {
        return Array.isArray(arr);
      },
      webRTCAdapter: deps && deps.adapter || adapter,
      httpAPICall: function(url, options) {
        let fetchOptions = {
          method: options.verb,
          headers: {
            "Accept": "application/json, text/plain, */*"
          },
          cache: "no-cache"
        };
        if (options.verb === "POST") {
          fetchOptions.headers["Content-Type"] = "application/json";
        }
        if (typeof options.withCredentials !== "undefined") {
          fetchOptions.credentials = options.withCredentials === true ? "include" : options.withCredentials ? options.withCredentials : "omit";
        }
        if (options.body) {
          fetchOptions.body = JSON.stringify(options.body);
        }
        let fetching = f(url, fetchOptions).catch(function(error) {
          return p.reject({ message: "Probably a network error, is the server down?", error });
        });
        if (options.timeout) {
          let timeout = new p(function(resolve, reject) {
            let timerId = setTimeout(function() {
              clearTimeout(timerId);
              return reject({ message: "Request timed out", timeout: options.timeout });
            }, options.timeout);
          });
          fetching = p.race([fetching, timeout]);
        }
        fetching.then(function(response) {
          if (response.ok) {
            if (typeof options.success === typeof Janus2.noop) {
              return response.json().then(function(parsed) {
                try {
                  options.success(parsed);
                } catch (error) {
                  Janus2.error("Unhandled httpAPICall success callback error", error);
                }
              }, function(error) {
                return p.reject({ message: "Failed to parse response body", error, response });
              });
            }
          } else {
            return p.reject({ message: "API call failed", response });
          }
        }).catch(function(error) {
          if (typeof options.error === typeof Janus2.noop) {
            options.error(error.message || "<< internal error >>", error);
          }
        });
        return fetching;
      }
    };
  };
  Janus2.useOldDependencies = function(deps) {
    let jq = deps && deps.jQuery || jQuery;
    let socketCls = deps && deps.WebSocket || WebSocket;
    return {
      newWebSocket: function(server, proto) {
        return new socketCls(server, proto);
      },
      isArray: function(arr) {
        return jq.isArray(arr);
      },
      extension: deps && deps.extension || defaultExtension,
      webRTCAdapter: deps && deps.adapter || adapter,
      httpAPICall: function(url, options) {
        let payload = typeof options.body !== "undefined" ? {
          contentType: "application/json",
          data: JSON.stringify(options.body)
        } : {};
        let credentials = typeof options.withCredentials !== "undefined" ? { xhrFields: { withCredentials: options.withCredentials } } : {};
        return jq.ajax(jq.extend(payload, credentials, {
          url,
          type: options.verb,
          cache: false,
          dataType: "json",
          async: options.async,
          timeout: options.timeout,
          success: function(result) {
            if (typeof options.success === typeof Janus2.noop) {
              options.success(result);
            }
          },
          // eslint-disable-next-line no-unused-vars
          error: function(xhr, status, err) {
            if (typeof options.error === typeof Janus2.noop) {
              options.error(status, err);
            }
          }
        }));
      }
    };
  };
  Janus2.mediaToTracks = function(media) {
    let tracks = [];
    if (!media) {
      tracks.push({ type: "audio", capture: true, recv: true });
      tracks.push({ type: "video", capture: true, recv: true });
    } else {
      if (!media.keepAudio && media.audio !== false && (typeof media.audio === "undefined" || media.audio || media.audioSend || media.audioRecv || media.addAudio || media.replaceAudio || media.removeAudio)) {
        let track = { type: "audio" };
        if (media.removeAudio) {
          track.remove = true;
        } else {
          if (media.addAudio)
            track.add = true;
          else if (media.replaceAudio)
            track.replace = true;
          if (media.audioSend !== false)
            track.capture = media.audio || true;
          if (media.audioRecv !== false)
            track.recv = true;
        }
        if (track.remove || track.capture || track.recv)
          tracks.push(track);
      }
      if (!media.keepVideo && media.video !== false && (typeof media.video === "undefined" || media.video || media.videoSend || media.videoRecv || media.addVideo || media.replaceVideo || media.removeVideo)) {
        let track = { type: "video" };
        if (media.removeVideo) {
          track.remove = true;
        } else {
          if (media.addVideo)
            track.add = true;
          else if (media.replaceVideo)
            track.replace = true;
          if (media.videoSend !== false) {
            track.capture = media.video || true;
            if (["screen", "window", "desktop"].includes(track.capture)) {
              track.type = "screen";
              track.capture = { video: {} };
              if (media.screenshareFrameRate)
                track.capture.frameRate = media.screenshareFrameRate;
              if (media.screenshareHeight)
                track.capture.height = media.screenshareHeight;
              if (media.screenshareWidth)
                track.capture.width = media.screenshareWidth;
            }
          }
          if (media.videoRecv !== false)
            track.recv = true;
        }
        if (track.remove || track.capture || track.recv)
          tracks.push(track);
      }
      if (media.data) {
        tracks.push({ type: "data" });
      }
    }
    return tracks;
  };
  Janus2.trackConstraints = function(track) {
    let constraints = {};
    if (!track || !track.capture)
      return constraints;
    if (track.type === "audio") {
      constraints.audio = track.capture;
    } else if (track.type === "video") {
      if ((track.simulcast || track.svc) && track.capture === true)
        track.capture = "hires";
      if (track.capture === true || typeof track.capture === "object") {
        constraints.video = track.capture;
      } else {
        let width = 0;
        let height = 0;
        if (track.capture === "lowres") {
          width = 320;
          height = 240;
        } else if (track.capture === "lowres-16:9") {
          width = 320;
          height = 180;
        } else if (track.capture === "hires" || track.capture === "hires-16:9" || track.capture === "hdres") {
          width = 1280;
          height = 720;
        } else if (track.capture === "fhdres") {
          width = 1920;
          height = 1080;
        } else if (track.capture === "4kres") {
          width = 3840;
          height = 2160;
        } else if (track.capture === "stdres") {
          width = 640;
          height = 480;
        } else if (track.capture === "stdres-16:9") {
          width = 640;
          height = 360;
        } else {
          Janus2.log("Default video setting is stdres 4:3");
          width = 640;
          height = 480;
        }
        constraints.video = {
          width: { ideal: width },
          height: { ideal: height }
        };
      }
    } else if (track.type === "screen") {
      constraints.video = track.capture;
    }
    return constraints;
  };
  Janus2.noop = function() {
  };
  Janus2.dataChanDefaultLabel = "JanusDataChannel";
  Janus2.endOfCandidates = null;
  Janus2.stopAllTracks = function(stream) {
    try {
      let tracks = stream.getTracks();
      for (let mst of tracks) {
        Janus2.log(mst);
        if (mst && mst.dontStop !== true) {
          mst.stop();
        }
      }
    } catch (e) {
    }
  };
  Janus2.init = function(options) {
    options = options || {};
    options.callback = typeof options.callback == "function" ? options.callback : Janus2.noop;
    if (Janus2.initDone) {
      options.callback();
    } else {
      if (typeof console.log == "undefined") {
        console.log = function() {
        };
      }
      Janus2.trace = Janus2.noop;
      Janus2.debug = Janus2.noop;
      Janus2.vdebug = Janus2.noop;
      Janus2.log = Janus2.noop;
      Janus2.warn = Janus2.noop;
      Janus2.error = Janus2.noop;
      if (options.debug === true || options.debug === "all") {
        Janus2.trace = console.trace.bind(console);
        Janus2.debug = console.debug.bind(console);
        Janus2.vdebug = console.debug.bind(console);
        Janus2.log = console.log.bind(console);
        Janus2.warn = console.warn.bind(console);
        Janus2.error = console.error.bind(console);
      } else if (Array.isArray(options.debug)) {
        for (let d of options.debug) {
          switch (d) {
            case "trace":
              Janus2.trace = console.trace.bind(console);
              break;
            case "debug":
              Janus2.debug = console.debug.bind(console);
              break;
            case "vdebug":
              Janus2.vdebug = console.debug.bind(console);
              break;
            case "log":
              Janus2.log = console.log.bind(console);
              break;
            case "warn":
              Janus2.warn = console.warn.bind(console);
              break;
            case "error":
              Janus2.error = console.error.bind(console);
              break;
            default:
              console.error("Unknown debugging option '" + d + "' (supported: 'trace', 'debug', 'vdebug', 'log', warn', 'error')");
              break;
          }
        }
      }
      Janus2.log("Initializing library");
      let usedDependencies = options.dependencies || Janus2.useDefaultDependencies();
      Janus2.isArray = usedDependencies.isArray;
      Janus2.webRTCAdapter = usedDependencies.webRTCAdapter;
      Janus2.httpAPICall = usedDependencies.httpAPICall;
      Janus2.newWebSocket = usedDependencies.newWebSocket;
      Janus2.extension = usedDependencies.extension;
      Janus2.extension.init();
      Janus2.listDevices = function(callback, config) {
        callback = typeof callback == "function" ? callback : Janus2.noop;
        if (!config)
          config = { audio: true, video: true };
        if (Janus2.isGetUserMediaAvailable()) {
          navigator.mediaDevices.getUserMedia(config).then(function(stream) {
            navigator.mediaDevices.enumerateDevices().then(function(devices) {
              Janus2.debug(devices);
              callback(devices);
              Janus2.stopAllTracks(stream);
            });
          }).catch(function(err) {
            Janus2.error(err);
            callback([]);
          });
        } else {
          Janus2.warn("navigator.mediaDevices unavailable");
          callback([]);
        }
      };
      Janus2.attachMediaStream = function(element, stream) {
        try {
          element.srcObject = stream;
        } catch (e) {
          try {
            element.src = URL.createObjectURL(stream);
          } catch (e2) {
            Janus2.error("Error attaching stream to element", e2);
          }
        }
      };
      Janus2.reattachMediaStream = function(to, from) {
        try {
          to.srcObject = from.srcObject;
        } catch (e) {
          try {
            to.src = from.src;
          } catch (e2) {
            Janus2.error("Error reattaching stream to element", e2);
          }
        }
      };
      let iOS = ["iPad", "iPhone", "iPod"].indexOf(navigator.platform) >= 0;
      let eventName = iOS ? "pagehide" : "beforeunload";
      let oldOBF = window["on" + eventName];
      window.addEventListener(eventName, function() {
        Janus2.log("Closing window");
        for (const [sessionId, session] of Janus2.sessions) {
          if (session && session.destroyOnUnload) {
            Janus2.log("Destroying session " + sessionId);
            session.destroy({ unload: true, notifyDestroyed: false });
          }
        }
        if (oldOBF && typeof oldOBF == "function") {
          oldOBF();
        }
      });
      Janus2.safariVp8 = false;
      Janus2.safariVp9 = false;
      if (Janus2.webRTCAdapter.browserDetails.browser === "safari" && Janus2.webRTCAdapter.browserDetails.version >= 605) {
        if (RTCRtpSender && RTCRtpSender.getCapabilities && RTCRtpSender.getCapabilities("video") && RTCRtpSender.getCapabilities("video").codecs && RTCRtpSender.getCapabilities("video").codecs.length) {
          for (let codec of RTCRtpSender.getCapabilities("video").codecs) {
            if (codec && codec.mimeType && codec.mimeType.toLowerCase() === "video/vp8") {
              Janus2.safariVp8 = true;
            } else if (codec && codec.mimeType && codec.mimeType.toLowerCase() === "video/vp9") {
              Janus2.safariVp9 = true;
            }
          }
          if (Janus2.safariVp8) {
            Janus2.log("This version of Safari supports VP8");
          } else {
            Janus2.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
          }
        } else {
          let testpc = new RTCPeerConnection({});
          testpc.createOffer({ offerToReceiveVideo: true }).then(function(offer) {
            Janus2.safariVp8 = offer.sdp.indexOf("VP8") !== -1;
            Janus2.safariVp9 = offer.sdp.indexOf("VP9") !== -1;
            if (Janus2.safariVp8) {
              Janus2.log("This version of Safari supports VP8");
            } else {
              Janus2.warn("This version of Safari does NOT support VP8: if you're using a Technology Preview, try enabling the 'WebRTC VP8 codec' setting in the 'Experimental Features' Develop menu");
            }
            testpc.close();
            testpc = null;
          });
        }
      }
      Janus2.initDone = true;
      options.callback();
    }
  };
  Janus2.isWebrtcSupported = function() {
    return !!window.RTCPeerConnection;
  };
  Janus2.isGetUserMediaAvailable = function() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  };
  Janus2.randomString = function(len) {
    let charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < len; i++) {
      let randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.charAt(randomPoz);
    }
    return randomString;
  };
  function Janus2(gatewayCallbacks) {
    gatewayCallbacks = gatewayCallbacks || {};
    gatewayCallbacks.success = typeof gatewayCallbacks.success == "function" ? gatewayCallbacks.success : Janus2.noop;
    gatewayCallbacks.error = typeof gatewayCallbacks.error == "function" ? gatewayCallbacks.error : Janus2.noop;
    gatewayCallbacks.destroyed = typeof gatewayCallbacks.destroyed == "function" ? gatewayCallbacks.destroyed : Janus2.noop;
    if (!Janus2.initDone) {
      gatewayCallbacks.error("Library not initialized");
      return {};
    }
    if (!Janus2.isWebrtcSupported()) {
      gatewayCallbacks.error("WebRTC not supported by this browser");
      return {};
    }
    Janus2.log("Library initialized: " + Janus2.initDone);
    if (!gatewayCallbacks.server) {
      gatewayCallbacks.error("Invalid server url");
      return {};
    }
    let websockets = false;
    let ws = null;
    let wsHandlers = {};
    let wsKeepaliveTimeoutId = null;
    let servers = null;
    let serversIndex = 0;
    let server = gatewayCallbacks.server;
    if (Janus2.isArray(server)) {
      Janus2.log("Multiple servers provided (" + server.length + "), will use the first that works");
      server = null;
      servers = gatewayCallbacks.server;
      Janus2.debug(servers);
    } else {
      if (server.indexOf("ws") === 0) {
        websockets = true;
        Janus2.log("Using WebSockets to contact Janus: " + server);
      } else {
        websockets = false;
        Janus2.log("Using REST API to contact Janus: " + server);
      }
    }
    let iceServers = gatewayCallbacks.iceServers || [{ urls: "stun:stun.l.google.com:19302" }];
    let iceTransportPolicy = gatewayCallbacks.iceTransportPolicy;
    let bundlePolicy = gatewayCallbacks.bundlePolicy;
    let withCredentials = false;
    if (typeof gatewayCallbacks.withCredentials !== "undefined" && gatewayCallbacks.withCredentials !== null)
      withCredentials = gatewayCallbacks.withCredentials === true;
    let maxev = 10;
    if (typeof gatewayCallbacks.max_poll_events !== "undefined" && gatewayCallbacks.max_poll_events !== null)
      maxev = gatewayCallbacks.max_poll_events;
    if (maxev < 1)
      maxev = 1;
    let token = null;
    if (typeof gatewayCallbacks.token !== "undefined" && gatewayCallbacks.token !== null)
      token = gatewayCallbacks.token;
    let apisecret = null;
    if (typeof gatewayCallbacks.apisecret !== "undefined" && gatewayCallbacks.apisecret !== null)
      apisecret = gatewayCallbacks.apisecret;
    this.destroyOnUnload = true;
    if (typeof gatewayCallbacks.destroyOnUnload !== "undefined" && gatewayCallbacks.destroyOnUnload !== null)
      this.destroyOnUnload = gatewayCallbacks.destroyOnUnload === true;
    let keepAlivePeriod = 25e3;
    if (typeof gatewayCallbacks.keepAlivePeriod !== "undefined" && gatewayCallbacks.keepAlivePeriod !== null)
      keepAlivePeriod = gatewayCallbacks.keepAlivePeriod;
    if (isNaN(keepAlivePeriod))
      keepAlivePeriod = 25e3;
    let longPollTimeout = 6e4;
    if (typeof gatewayCallbacks.longPollTimeout !== "undefined" && gatewayCallbacks.longPollTimeout !== null)
      longPollTimeout = gatewayCallbacks.longPollTimeout;
    if (isNaN(longPollTimeout))
      longPollTimeout = 6e4;
    function getMaxBitrates(simulcastMaxBitrates) {
      let maxBitrates = {
        high: 9e5,
        medium: 3e5,
        low: 1e5
      };
      if (typeof simulcastMaxBitrates !== "undefined" && simulcastMaxBitrates !== null) {
        if (simulcastMaxBitrates.high)
          maxBitrates.high = simulcastMaxBitrates.high;
        if (simulcastMaxBitrates.medium)
          maxBitrates.medium = simulcastMaxBitrates.medium;
        if (simulcastMaxBitrates.low)
          maxBitrates.low = simulcastMaxBitrates.low;
      }
      return maxBitrates;
    }
    let connected = false;
    let sessionId = null;
    let pluginHandles = /* @__PURE__ */ new Map();
    let that = this;
    let retries = 0;
    let transactions = /* @__PURE__ */ new Map();
    createSession(gatewayCallbacks);
    this.getServer = function() {
      return server;
    };
    this.isConnected = function() {
      return connected;
    };
    this.reconnect = function(callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      callbacks["reconnect"] = true;
      createSession(callbacks);
    };
    this.getSessionId = function() {
      return sessionId;
    };
    this.getInfo = function(callbacks) {
      getInfo(callbacks);
    };
    this.destroy = function(callbacks) {
      destroySession(callbacks);
    };
    this.attach = function(callbacks) {
      createHandle(callbacks);
    };
    function eventHandler() {
      if (sessionId == null)
        return;
      Janus2.debug("Long poll...");
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        return;
      }
      let longpoll = server + "/" + sessionId + "?rid=" + (/* @__PURE__ */ new Date()).getTime();
      if (maxev)
        longpoll = longpoll + "&maxev=" + maxev;
      if (token)
        longpoll = longpoll + "&token=" + encodeURIComponent(token);
      if (apisecret)
        longpoll = longpoll + "&apisecret=" + encodeURIComponent(apisecret);
      Janus2.httpAPICall(longpoll, {
        verb: "GET",
        withCredentials,
        success: handleEvent,
        timeout: longPollTimeout,
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          retries++;
          if (retries > 3) {
            connected = false;
            gatewayCallbacks.error("Lost connection to the server (is it down?)");
            return;
          }
          eventHandler();
        }
      });
    }
    function handleEvent(json, skipTimeout) {
      retries = 0;
      if (!websockets && typeof sessionId !== "undefined" && sessionId !== null && skipTimeout !== true)
        eventHandler();
      if (!websockets && Janus2.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
          handleEvent(json[i], true);
        }
        return;
      }
      if (json["janus"] === "keepalive") {
        Janus2.vdebug("Got a keepalive on session " + sessionId);
        return;
      } else if (json["janus"] === "server_info") {
        Janus2.debug("Got info on the Janus instance");
        Janus2.debug(json);
        const transaction = json["transaction"];
        if (transaction) {
          const reportSuccess = transactions.get(transaction);
          if (reportSuccess)
            reportSuccess(json);
          transactions.delete(transaction);
        }
        return;
      } else if (json["janus"] === "ack") {
        Janus2.debug("Got an ack on session " + sessionId);
        Janus2.debug(json);
        const transaction = json["transaction"];
        if (transaction) {
          const reportSuccess = transactions.get(transaction);
          if (reportSuccess)
            reportSuccess(json);
          transactions.delete(transaction);
        }
        return;
      } else if (json["janus"] === "success") {
        Janus2.debug("Got a success on session " + sessionId);
        Janus2.debug(json);
        const transaction = json["transaction"];
        if (transaction) {
          const reportSuccess = transactions.get(transaction);
          if (reportSuccess)
            reportSuccess(json);
          transactions.delete(transaction);
        }
        return;
      } else if (json["janus"] === "trickle") {
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          Janus2.debug("This handle is not attached to this session");
          return;
        }
        let candidate = json["candidate"];
        Janus2.debug("Got a trickled candidate on session " + sessionId);
        Janus2.debug(candidate);
        let config = pluginHandle.webrtcStuff;
        if (config.pc && config.remoteSdp) {
          Janus2.debug("Adding remote candidate:", candidate);
          if (!candidate || candidate.completed === true) {
            config.pc.addIceCandidate(Janus2.endOfCandidates);
          } else {
            config.pc.addIceCandidate(candidate);
          }
        } else {
          Janus2.debug("We didn't do setRemoteDescription (trickle got here before the offer?), caching candidate");
          if (!config.candidates)
            config.candidates = [];
          config.candidates.push(candidate);
          Janus2.debug(config.candidates);
        }
      } else if (json["janus"] === "webrtcup") {
        Janus2.debug("Got a webrtcup event on session " + sessionId);
        Janus2.debug(json);
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          Janus2.debug("This handle is not attached to this session");
          return;
        }
        pluginHandle.webrtcState(true);
        return;
      } else if (json["janus"] === "hangup") {
        Janus2.debug("Got a hangup event on session " + sessionId);
        Janus2.debug(json);
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          Janus2.debug("This handle is not attached to this session");
          return;
        }
        pluginHandle.webrtcState(false, json["reason"]);
        pluginHandle.hangup();
      } else if (json["janus"] === "detached") {
        Janus2.debug("Got a detached event on session " + sessionId);
        Janus2.debug(json);
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          return;
        }
        pluginHandle.ondetached();
        pluginHandle.detach();
      } else if (json["janus"] === "media") {
        Janus2.debug("Got a media event on session " + sessionId);
        Janus2.debug(json);
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          Janus2.debug("This handle is not attached to this session");
          return;
        }
        pluginHandle.mediaState(json["type"], json["receiving"], json["mid"]);
      } else if (json["janus"] === "slowlink") {
        Janus2.debug("Got a slowlink event on session " + sessionId);
        Janus2.debug(json);
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          Janus2.debug("This handle is not attached to this session");
          return;
        }
        pluginHandle.slowLink(json["uplink"], json["lost"], json["mid"]);
      } else if (json["janus"] === "error") {
        Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
        Janus2.debug(json);
        let transaction = json["transaction"];
        if (transaction) {
          let reportSuccess = transactions.get(transaction);
          if (reportSuccess) {
            reportSuccess(json);
          }
          transactions.delete(transaction);
        }
        return;
      } else if (json["janus"] === "event") {
        Janus2.debug("Got a plugin event on session " + sessionId);
        Janus2.debug(json);
        const sender = json["sender"];
        if (!sender) {
          Janus2.warn("Missing sender...");
          return;
        }
        let plugindata = json["plugindata"];
        if (!plugindata) {
          Janus2.warn("Missing plugindata...");
          return;
        }
        Janus2.debug("  -- Event is coming from " + sender + " (" + plugindata["plugin"] + ")");
        let data = plugindata["data"];
        Janus2.debug(data);
        const pluginHandle = pluginHandles.get(sender);
        if (!pluginHandle) {
          Janus2.warn("This handle is not attached to this session");
          return;
        }
        let jsep = json["jsep"];
        if (jsep) {
          Janus2.debug("Handling SDP as well...");
          Janus2.debug(jsep);
        }
        let callback = pluginHandle.onmessage;
        if (callback) {
          Janus2.debug("Notifying application...");
          callback(data, jsep);
        } else {
          Janus2.debug("No provided notification callback");
        }
      } else if (json["janus"] === "timeout") {
        Janus2.error("Timeout on session " + sessionId);
        Janus2.debug(json);
        if (websockets) {
          ws.close(3504, "Gateway timeout");
        }
        return;
      } else {
        Janus2.warn("Unknown message/event  '" + json["janus"] + "' on session " + sessionId);
        Janus2.debug(json);
      }
    }
    function keepAlive() {
      if (!server || !websockets || !connected)
        return;
      wsKeepaliveTimeoutId = setTimeout(keepAlive, keepAlivePeriod);
      let request = { "janus": "keepalive", "session_id": sessionId, "transaction": Janus2.randomString(12) };
      if (token)
        request["token"] = token;
      if (apisecret)
        request["apisecret"] = apisecret;
      ws.send(JSON.stringify(request));
    }
    function createSession(callbacks) {
      let transaction = Janus2.randomString(12);
      let request = { "janus": "create", "transaction": transaction };
      if (callbacks["reconnect"]) {
        connected = false;
        request["janus"] = "claim";
        request["session_id"] = sessionId;
        if (ws) {
          ws.onopen = null;
          ws.onerror = null;
          ws.onclose = null;
          if (wsKeepaliveTimeoutId) {
            clearTimeout(wsKeepaliveTimeoutId);
            wsKeepaliveTimeoutId = null;
          }
        }
      }
      if (token)
        request["token"] = token;
      if (apisecret)
        request["apisecret"] = apisecret;
      if (!server && Janus2.isArray(servers)) {
        server = servers[serversIndex];
        if (server.indexOf("ws") === 0) {
          websockets = true;
          Janus2.log("Server #" + (serversIndex + 1) + ": trying WebSockets to contact Janus (" + server + ")");
        } else {
          websockets = false;
          Janus2.log("Server #" + (serversIndex + 1) + ": trying REST API to contact Janus (" + server + ")");
        }
      }
      if (websockets) {
        ws = Janus2.newWebSocket(server, "janus-protocol");
        wsHandlers = {
          "error": function() {
            Janus2.error("Error connecting to the Janus WebSockets server... " + server);
            if (Janus2.isArray(servers) && !callbacks["reconnect"]) {
              serversIndex++;
              if (serversIndex === servers.length) {
                callbacks.error("Error connecting to any of the provided Janus servers: Is the server down?");
                return;
              }
              server = null;
              setTimeout(function() {
                createSession(callbacks);
              }, 200);
              return;
            }
            callbacks.error("Error connecting to the Janus WebSockets server: Is the server down?");
          },
          "open": function() {
            transactions.set(transaction, function(json) {
              Janus2.debug(json);
              if (json["janus"] !== "success") {
                Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
                callbacks.error(json["error"].reason);
                return;
              }
              wsKeepaliveTimeoutId = setTimeout(keepAlive, keepAlivePeriod);
              connected = true;
              sessionId = json["session_id"] ? json["session_id"] : json.data["id"];
              if (callbacks["reconnect"]) {
                Janus2.log("Claimed session: " + sessionId);
              } else {
                Janus2.log("Created session: " + sessionId);
              }
              Janus2.sessions.set(sessionId, that);
              callbacks.success();
            });
            ws.send(JSON.stringify(request));
          },
          "message": function(event) {
            handleEvent(JSON.parse(event.data));
          },
          "close": function() {
            if (!server || !connected) {
              return;
            }
            connected = false;
            gatewayCallbacks.error("Lost connection to the server (is it down?)");
          }
        };
        for (let eventName in wsHandlers) {
          ws.addEventListener(eventName, wsHandlers[eventName]);
        }
        return;
      }
      Janus2.httpAPICall(server, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.debug(json);
          if (json["janus"] !== "success") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
            callbacks.error(json["error"].reason);
            return;
          }
          connected = true;
          sessionId = json["session_id"] ? json["session_id"] : json.data["id"];
          if (callbacks["reconnect"]) {
            Janus2.log("Claimed session: " + sessionId);
          } else {
            Janus2.log("Created session: " + sessionId);
          }
          Janus2.sessions.set(sessionId, that);
          eventHandler();
          callbacks.success();
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          if (Janus2.isArray(servers) && !callbacks["reconnect"]) {
            serversIndex++;
            if (serversIndex === servers.length) {
              callbacks.error("Error connecting to any of the provided Janus servers: Is the server down?");
              return;
            }
            server = null;
            setTimeout(function() {
              createSession(callbacks);
            }, 200);
            return;
          }
          if (errorThrown === "")
            callbacks.error(textStatus + ": Is the server down?");
          else if (errorThrown && errorThrown.error)
            callbacks.error(textStatus + ": " + errorThrown.error.message);
          else
            callbacks.error(textStatus + ": " + errorThrown);
        }
      });
    }
    function getInfo(callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      Janus2.log("Getting info on Janus instance");
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        callbacks.error("Is the server down? (connected=false)");
        return;
      }
      let transaction = Janus2.randomString(12);
      let request = { "janus": "info", "transaction": transaction };
      if (token)
        request["token"] = token;
      if (apisecret)
        request["apisecret"] = apisecret;
      if (websockets) {
        transactions.set(transaction, function(json) {
          Janus2.log("Server info:");
          Janus2.debug(json);
          if (json["janus"] !== "server_info") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
          }
          callbacks.success(json);
        });
        ws.send(JSON.stringify(request));
        return;
      }
      Janus2.httpAPICall(server, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.log("Server info:");
          Janus2.debug(json);
          if (json["janus"] !== "server_info") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
          }
          callbacks.success(json);
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          if (errorThrown === "")
            callbacks.error(textStatus + ": Is the server down?");
          else
            callbacks.error(textStatus + ": " + errorThrown);
        }
      });
    }
    function destroySession(callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      let unload = callbacks.unload === true;
      let notifyDestroyed = true;
      if (typeof callbacks.notifyDestroyed !== "undefined" && callbacks.notifyDestroyed !== null)
        notifyDestroyed = callbacks.notifyDestroyed === true;
      let cleanupHandles = callbacks.cleanupHandles === true;
      Janus2.log("Destroying session " + sessionId + " (unload=" + unload + ")");
      if (!sessionId) {
        Janus2.warn("No session to destroy");
        callbacks.success();
        if (notifyDestroyed)
          gatewayCallbacks.destroyed();
        return;
      }
      if (cleanupHandles) {
        for (const handleId of pluginHandles.keys())
          destroyHandle(handleId, { noRequest: true });
      }
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        sessionId = null;
        callbacks.success();
        return;
      }
      let request = { "janus": "destroy", "transaction": Janus2.randomString(12) };
      if (token)
        request["token"] = token;
      if (apisecret)
        request["apisecret"] = apisecret;
      if (unload) {
        if (websockets) {
          ws.onclose = null;
          ws.close();
          ws = null;
        } else {
          navigator.sendBeacon(server + "/" + sessionId, JSON.stringify(request));
        }
        Janus2.log("Destroyed session:");
        sessionId = null;
        connected = false;
        callbacks.success();
        if (notifyDestroyed)
          gatewayCallbacks.destroyed();
        return;
      }
      if (websockets) {
        request["session_id"] = sessionId;
        let unbindWebSocket = function() {
          for (let eventName in wsHandlers) {
            ws.removeEventListener(eventName, wsHandlers[eventName]);
          }
          ws.removeEventListener("message", onUnbindMessage);
          ws.removeEventListener("error", onUnbindError);
          if (wsKeepaliveTimeoutId) {
            clearTimeout(wsKeepaliveTimeoutId);
          }
          ws.close();
        };
        let onUnbindMessage = function(event) {
          let data = JSON.parse(event.data);
          if (data.session_id == request.session_id && data.transaction == request.transaction) {
            unbindWebSocket();
            callbacks.success();
            if (notifyDestroyed)
              gatewayCallbacks.destroyed();
          }
        };
        let onUnbindError = function() {
          unbindWebSocket();
          callbacks.error("Failed to destroy the server: Is the server down?");
          if (notifyDestroyed)
            gatewayCallbacks.destroyed();
        };
        ws.addEventListener("message", onUnbindMessage);
        ws.addEventListener("error", onUnbindError);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify(request));
        } else {
          onUnbindError();
        }
        return;
      }
      Janus2.httpAPICall(server + "/" + sessionId, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.log("Destroyed session:");
          Janus2.debug(json);
          sessionId = null;
          connected = false;
          if (json["janus"] !== "success") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
          }
          callbacks.success();
          if (notifyDestroyed)
            gatewayCallbacks.destroyed();
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          sessionId = null;
          connected = false;
          callbacks.success();
          if (notifyDestroyed)
            gatewayCallbacks.destroyed();
        }
      });
    }
    function createHandle(callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      callbacks.dataChannelOptions = callbacks.dataChannelOptions || { ordered: true };
      callbacks.consentDialog = typeof callbacks.consentDialog == "function" ? callbacks.consentDialog : Janus2.noop;
      callbacks.connectionState = typeof callbacks.connectionState == "function" ? callbacks.connectionState : Janus2.noop;
      callbacks.iceState = typeof callbacks.iceState == "function" ? callbacks.iceState : Janus2.noop;
      callbacks.mediaState = typeof callbacks.mediaState == "function" ? callbacks.mediaState : Janus2.noop;
      callbacks.webrtcState = typeof callbacks.webrtcState == "function" ? callbacks.webrtcState : Janus2.noop;
      callbacks.slowLink = typeof callbacks.slowLink == "function" ? callbacks.slowLink : Janus2.noop;
      callbacks.onmessage = typeof callbacks.onmessage == "function" ? callbacks.onmessage : Janus2.noop;
      callbacks.onlocaltrack = typeof callbacks.onlocaltrack == "function" ? callbacks.onlocaltrack : Janus2.noop;
      callbacks.onremotetrack = typeof callbacks.onremotetrack == "function" ? callbacks.onremotetrack : Janus2.noop;
      callbacks.ondata = typeof callbacks.ondata == "function" ? callbacks.ondata : Janus2.noop;
      callbacks.ondataopen = typeof callbacks.ondataopen == "function" ? callbacks.ondataopen : Janus2.noop;
      callbacks.oncleanup = typeof callbacks.oncleanup == "function" ? callbacks.oncleanup : Janus2.noop;
      callbacks.ondetached = typeof callbacks.ondetached == "function" ? callbacks.ondetached : Janus2.noop;
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        callbacks.error("Is the server down? (connected=false)");
        return;
      }
      let plugin = callbacks.plugin;
      if (!plugin) {
        Janus2.error("Invalid plugin");
        callbacks.error("Invalid plugin");
        return;
      }
      let opaqueId = callbacks.opaqueId;
      let loopIndex = callbacks.loopIndex;
      let handleToken = callbacks.token ? callbacks.token : token;
      let transaction = Janus2.randomString(12);
      let request = { "janus": "attach", "plugin": plugin, "opaque_id": opaqueId, "loop_index": loopIndex, "transaction": transaction };
      if (handleToken)
        request["token"] = handleToken;
      if (apisecret)
        request["apisecret"] = apisecret;
      if (websockets) {
        transactions.set(transaction, function(json) {
          Janus2.debug(json);
          if (json["janus"] !== "success") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
            callbacks.error("Ooops: " + json["error"].code + " " + json["error"].reason);
            return;
          }
          let handleId = json.data["id"];
          Janus2.log("Created handle: " + handleId);
          let pluginHandle = {
            session: that,
            plugin,
            id: handleId,
            token: handleToken,
            detached: false,
            webrtcStuff: {
              started: false,
              myStream: null,
              streamExternal: false,
              mySdp: null,
              mediaConstraints: null,
              pc: null,
              dataChannelOptions: callbacks.dataChannelOptions,
              dataChannel: {},
              dtmfSender: null,
              trickle: true,
              iceDone: false,
              bitrate: {}
            },
            getId: function() {
              return handleId;
            },
            getPlugin: function() {
              return plugin;
            },
            getVolume: function(mid, result) {
              return getVolume(handleId, mid, true, result);
            },
            getRemoteVolume: function(mid, result) {
              return getVolume(handleId, mid, true, result);
            },
            getLocalVolume: function(mid, result) {
              return getVolume(handleId, mid, false, result);
            },
            isAudioMuted: function(mid) {
              return isMuted(handleId, mid, false);
            },
            muteAudio: function(mid) {
              return mute(handleId, mid, false, true);
            },
            unmuteAudio: function(mid) {
              return mute(handleId, mid, false, false);
            },
            isVideoMuted: function(mid) {
              return isMuted(handleId, mid, true);
            },
            muteVideo: function(mid) {
              return mute(handleId, mid, true, true);
            },
            unmuteVideo: function(mid) {
              return mute(handleId, mid, true, false);
            },
            getBitrate: function(mid) {
              return getBitrate(handleId, mid);
            },
            getRtcStats: function(mid) {
              return getRtcStats(handleId);
            },
            setMaxBitrate: function(mid, bitrate) {
              return setBitrate(handleId, mid, bitrate);
            },
            send: function(callbacks2) {
              sendMessage(handleId, callbacks2);
            },
            data: function(callbacks2) {
              sendData(handleId, callbacks2);
            },
            dtmf: function(callbacks2) {
              sendDtmf(handleId, callbacks2);
            },
            consentDialog: callbacks.consentDialog,
            connectionState: callbacks.connectionState,
            iceState: callbacks.iceState,
            mediaState: callbacks.mediaState,
            webrtcState: callbacks.webrtcState,
            slowLink: callbacks.slowLink,
            onmessage: callbacks.onmessage,
            createOffer: function(callbacks2) {
              prepareWebrtc(handleId, true, callbacks2);
            },
            createAnswer: function(callbacks2) {
              prepareWebrtc(handleId, false, callbacks2);
            },
            handleRemoteJsep: function(callbacks2) {
              prepareWebrtcPeer(handleId, callbacks2);
            },
            replaceTracks: function(callbacks2) {
              replaceTracks(handleId, callbacks2);
            },
            getLocalTracks: function() {
              return getLocalTracks(handleId);
            },
            getRemoteTracks: function() {
              return getRemoteTracks(handleId);
            },
            onlocaltrack: callbacks.onlocaltrack,
            onremotetrack: callbacks.onremotetrack,
            ondata: callbacks.ondata,
            ondataopen: callbacks.ondataopen,
            oncleanup: callbacks.oncleanup,
            ondetached: callbacks.ondetached,
            hangup: function(sendRequest) {
              cleanupWebrtc(handleId, sendRequest === true);
            },
            detach: function(callbacks2) {
              destroyHandle(handleId, callbacks2);
            }
          };
          pluginHandles.set(handleId, pluginHandle);
          callbacks.success(pluginHandle);
        });
        request["session_id"] = sessionId;
        ws.send(JSON.stringify(request));
        return;
      }
      Janus2.httpAPICall(server + "/" + sessionId, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.debug(json);
          if (json["janus"] !== "success") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
            callbacks.error("Ooops: " + json["error"].code + " " + json["error"].reason);
            return;
          }
          let handleId = json.data["id"];
          Janus2.log("Created handle: " + handleId);
          let pluginHandle = {
            session: that,
            plugin,
            id: handleId,
            token: handleToken,
            detached: false,
            webrtcStuff: {
              started: false,
              myStream: null,
              streamExternal: false,
              mySdp: null,
              mediaConstraints: null,
              pc: null,
              dataChannelOptions: callbacks.dataChannelOptions,
              dataChannel: {},
              dtmfSender: null,
              trickle: true,
              iceDone: false,
              bitrate: {}
            },
            getId: function() {
              return handleId;
            },
            getPlugin: function() {
              return plugin;
            },
            getVolume: function(mid, result) {
              return getVolume(handleId, mid, true, result);
            },
            getRemoteVolume: function(mid, result) {
              return getVolume(handleId, mid, true, result);
            },
            getLocalVolume: function(mid, result) {
              return getVolume(handleId, mid, false, result);
            },
            isAudioMuted: function(mid) {
              return isMuted(handleId, mid, false);
            },
            muteAudio: function(mid) {
              return mute(handleId, mid, false, true);
            },
            unmuteAudio: function(mid) {
              return mute(handleId, mid, false, false);
            },
            isVideoMuted: function(mid) {
              return isMuted(handleId, mid, true);
            },
            muteVideo: function(mid) {
              return mute(handleId, mid, true, true);
            },
            unmuteVideo: function(mid) {
              return mute(handleId, mid, true, false);
            },
            getBitrate: function(mid) {
              return getBitrate(handleId, mid);
            },
            getRtcStats: function(mid) {
              return getRtcStats(handleId);
            },
            setMaxBitrate: function(mid, bitrate) {
              return setBitrate(handleId, mid, bitrate);
            },
            send: function(callbacks2) {
              sendMessage(handleId, callbacks2);
            },
            data: function(callbacks2) {
              sendData(handleId, callbacks2);
            },
            dtmf: function(callbacks2) {
              sendDtmf(handleId, callbacks2);
            },
            consentDialog: callbacks.consentDialog,
            connectionState: callbacks.connectionState,
            iceState: callbacks.iceState,
            mediaState: callbacks.mediaState,
            webrtcState: callbacks.webrtcState,
            slowLink: callbacks.slowLink,
            onmessage: callbacks.onmessage,
            createOffer: function(callbacks2) {
              prepareWebrtc(handleId, true, callbacks2);
            },
            createAnswer: function(callbacks2) {
              prepareWebrtc(handleId, false, callbacks2);
            },
            handleRemoteJsep: function(callbacks2) {
              prepareWebrtcPeer(handleId, callbacks2);
            },
            replaceTracks: function(callbacks2) {
              replaceTracks(handleId, callbacks2);
            },
            getLocalTracks: function() {
              return getLocalTracks(handleId);
            },
            getRemoteTracks: function() {
              return getRemoteTracks(handleId);
            },
            onlocaltrack: callbacks.onlocaltrack,
            onremotetrack: callbacks.onremotetrack,
            ondata: callbacks.ondata,
            ondataopen: callbacks.ondataopen,
            oncleanup: callbacks.oncleanup,
            ondetached: callbacks.ondetached,
            hangup: function(sendRequest) {
              cleanupWebrtc(handleId, sendRequest === true);
            },
            detach: function(callbacks2) {
              destroyHandle(handleId, callbacks2);
            }
          };
          pluginHandles.set(handleId, pluginHandle);
          callbacks.success(pluginHandle);
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          if (errorThrown === "")
            callbacks.error(textStatus + ": Is the server down?");
          else
            callbacks.error(textStatus + ": " + errorThrown);
        }
      });
    }
    function sendMessage(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        callbacks.error("Is the server down? (connected=false)");
        return;
      }
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        callbacks.error("Invalid handle");
        return;
      }
      let message = callbacks.message;
      let jsep = callbacks.jsep;
      let transaction = Janus2.randomString(12);
      let request = { "janus": "message", "body": message, "transaction": transaction };
      if (pluginHandle.token)
        request["token"] = pluginHandle.token;
      if (apisecret)
        request["apisecret"] = apisecret;
      if (jsep) {
        request.jsep = {
          type: jsep.type,
          sdp: jsep.sdp
        };
        if (jsep.e2ee)
          request.jsep.e2ee = true;
        if (jsep.rid_order === "hml" || jsep.rid_order === "lmh")
          request.jsep.rid_order = jsep.rid_order;
        if (jsep.force_relay)
          request.jsep.force_relay = true;
        let svc = null;
        let config = pluginHandle.webrtcStuff;
        if (config.pc) {
          let transceivers = config.pc.getTransceivers();
          if (transceivers && transceivers.length > 0) {
            for (let mindex in transceivers) {
              let tr = transceivers[mindex];
              if (tr && tr.sender && tr.sender.track && tr.sender.track.kind === "video") {
                let params = tr.sender.getParameters();
                if (params && params.encodings && params.encodings[0] && params.encodings[0].scalabilityMode) {
                  if (!svc)
                    svc = [];
                  svc.push({
                    mindex: parseInt(mindex),
                    mid: tr.mid,
                    svc: params.encodings[0].scalabilityMode
                  });
                }
              }
            }
          }
        }
        if (svc)
          request.jsep.svc = svc;
      }
      Janus2.debug("Sending message to plugin (handle=" + handleId + "):");
      Janus2.debug(request);
      if (websockets) {
        request["session_id"] = sessionId;
        request["handle_id"] = handleId;
        transactions.set(transaction, function(json) {
          Janus2.debug("Message sent!");
          Janus2.debug(json);
          if (json["janus"] === "success") {
            let plugindata = json["plugindata"];
            if (!plugindata) {
              Janus2.warn("Request succeeded, but missing plugindata...");
              callbacks.success();
              return;
            }
            Janus2.log("Synchronous transaction successful (" + plugindata["plugin"] + ")");
            let data = plugindata["data"];
            Janus2.debug(data);
            callbacks.success(data);
            return;
          } else if (json["janus"] !== "ack") {
            if (json["error"]) {
              Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
              callbacks.error(json["error"].code + " " + json["error"].reason);
            } else {
              Janus2.error("Unknown error");
              callbacks.error("Unknown error");
            }
            return;
          }
          callbacks.success();
        });
        ws.send(JSON.stringify(request));
        return;
      }
      Janus2.httpAPICall(server + "/" + sessionId + "/" + handleId, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.debug("Message sent!");
          Janus2.debug(json);
          if (json["janus"] === "success") {
            let plugindata = json["plugindata"];
            if (!plugindata) {
              Janus2.warn("Request succeeded, but missing plugindata...");
              callbacks.success();
              return;
            }
            Janus2.log("Synchronous transaction successful (" + plugindata["plugin"] + ")");
            let data = plugindata["data"];
            Janus2.debug(data);
            callbacks.success(data);
            return;
          } else if (json["janus"] !== "ack") {
            if (json["error"]) {
              Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
              callbacks.error(json["error"].code + " " + json["error"].reason);
            } else {
              Janus2.error("Unknown error");
              callbacks.error("Unknown error");
            }
            return;
          }
          callbacks.success();
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          callbacks.error(textStatus + ": " + errorThrown);
        }
      });
    }
    function sendTrickleCandidate(handleId, candidate) {
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        return;
      }
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return;
      }
      let request = { "janus": "trickle", "candidate": candidate, "transaction": Janus2.randomString(12) };
      if (pluginHandle.token)
        request["token"] = pluginHandle.token;
      if (apisecret)
        request["apisecret"] = apisecret;
      Janus2.vdebug("Sending trickle candidate (handle=" + handleId + "):");
      Janus2.vdebug(request);
      if (websockets) {
        request["session_id"] = sessionId;
        request["handle_id"] = handleId;
        ws.send(JSON.stringify(request));
        return;
      }
      Janus2.httpAPICall(server + "/" + sessionId + "/" + handleId, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.vdebug("Candidate sent!");
          Janus2.vdebug(json);
          if (json["janus"] !== "ack") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
            return;
          }
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
        }
      });
    }
    function createDataChannel(handleId, dclabel, dcprotocol, incoming, pendingData) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        return;
      }
      let onDataChannelMessage = function(event) {
        Janus2.log("Received message on data channel:", event);
        let label = event.target.label;
        pluginHandle.ondata(event.data, label);
      };
      let onDataChannelStateChange = function(event) {
        Janus2.log("Received state change on data channel:", event);
        let label = event.target.label;
        let protocol = event.target.protocol;
        let dcState = config.dataChannel[label] ? config.dataChannel[label].readyState : "null";
        Janus2.log("State change on <" + label + "> data channel: " + dcState);
        if (dcState === "open") {
          if (config.dataChannel[label].pending && config.dataChannel[label].pending.length > 0) {
            Janus2.log("Sending pending messages on <" + label + ">:", config.dataChannel[label].pending.length);
            for (let data of config.dataChannel[label].pending) {
              Janus2.log("Sending data on data channel <" + label + ">");
              Janus2.debug(data);
              config.dataChannel[label].send(data);
            }
            config.dataChannel[label].pending = [];
          }
          pluginHandle.ondataopen(label, protocol);
        }
      };
      let onDataChannelError = function(error) {
        Janus2.error("Got error on data channel:", error);
      };
      if (!incoming) {
        let dcoptions = config.dataChannelOptions;
        if (dcprotocol)
          dcoptions.protocol = dcprotocol;
        config.dataChannel[dclabel] = config.pc.createDataChannel(dclabel, dcoptions);
      } else {
        config.dataChannel[dclabel] = incoming;
      }
      config.dataChannel[dclabel].onmessage = onDataChannelMessage;
      config.dataChannel[dclabel].onopen = onDataChannelStateChange;
      config.dataChannel[dclabel].onclose = onDataChannelStateChange;
      config.dataChannel[dclabel].onerror = onDataChannelError;
      config.dataChannel[dclabel].pending = [];
      if (pendingData)
        config.dataChannel[dclabel].pending.push(pendingData);
    }
    function sendData(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        callbacks.error("Invalid handle");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      let data = callbacks.text || callbacks.data;
      if (!data) {
        Janus2.warn("Invalid data");
        callbacks.error("Invalid data");
        return;
      }
      let label = callbacks.label ? callbacks.label : Janus2.dataChanDefaultLabel;
      if (!config.dataChannel[label]) {
        createDataChannel(handleId, label, callbacks.protocol, false, data, callbacks.protocol);
        callbacks.success();
        return;
      }
      if (config.dataChannel[label].readyState !== "open") {
        config.dataChannel[label].pending.push(data);
        callbacks.success();
        return;
      }
      Janus2.log("Sending data on data channel <" + label + ">");
      Janus2.debug(data);
      config.dataChannel[label].send(data);
      callbacks.success();
    }
    function sendDtmf(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        callbacks.error("Invalid handle");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.dtmfSender) {
        if (config.pc) {
          let senders = config.pc.getSenders();
          let audioSender = senders.find(function(sender) {
            return sender.track && sender.track.kind === "audio";
          });
          if (!audioSender) {
            Janus2.warn("Invalid DTMF configuration (no audio track)");
            callbacks.error("Invalid DTMF configuration (no audio track)");
            return;
          }
          config.dtmfSender = audioSender.dtmf;
          if (config.dtmfSender) {
            Janus2.log("Created DTMF Sender");
            config.dtmfSender.ontonechange = function(tone) {
              Janus2.debug("Sent DTMF tone: " + tone.tone);
            };
          }
        }
        if (!config.dtmfSender) {
          Janus2.warn("Invalid DTMF configuration");
          callbacks.error("Invalid DTMF configuration");
          return;
        }
      }
      let dtmf = callbacks.dtmf;
      if (!dtmf) {
        Janus2.warn("Invalid DTMF parameters");
        callbacks.error("Invalid DTMF parameters");
        return;
      }
      let tones = dtmf.tones;
      if (!tones) {
        Janus2.warn("Invalid DTMF string");
        callbacks.error("Invalid DTMF string");
        return;
      }
      let duration = typeof dtmf.duration === "number" ? dtmf.duration : 500;
      let gap = typeof dtmf.gap === "number" ? dtmf.gap : 50;
      Janus2.debug("Sending DTMF string " + tones + " (duration " + duration + "ms, gap " + gap + "ms)");
      config.dtmfSender.insertDTMF(tones, duration, gap);
      callbacks.success();
    }
    function destroyHandle(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      let noRequest = callbacks.noRequest === true;
      Janus2.log("Destroying handle " + handleId + " (only-locally=" + noRequest + ")");
      cleanupWebrtc(handleId);
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || pluginHandle.detached) {
        pluginHandles.delete(handleId);
        callbacks.success();
        return;
      }
      pluginHandle.detached = true;
      if (noRequest) {
        pluginHandles.delete(handleId);
        callbacks.success();
        return;
      }
      if (!connected) {
        Janus2.warn("Is the server down? (connected=false)");
        callbacks.error("Is the server down? (connected=false)");
        return;
      }
      let request = { "janus": "detach", "transaction": Janus2.randomString(12) };
      if (pluginHandle.token)
        request["token"] = pluginHandle.token;
      if (apisecret)
        request["apisecret"] = apisecret;
      if (websockets) {
        request["session_id"] = sessionId;
        request["handle_id"] = handleId;
        ws.send(JSON.stringify(request));
        pluginHandles.delete(handleId);
        callbacks.success();
        return;
      }
      Janus2.httpAPICall(server + "/" + sessionId + "/" + handleId, {
        verb: "POST",
        withCredentials,
        body: request,
        success: function(json) {
          Janus2.log("Destroyed handle:");
          Janus2.debug(json);
          if (json["janus"] !== "success") {
            Janus2.error("Ooops: " + json["error"].code + " " + json["error"].reason);
          }
          pluginHandles.delete(handleId);
          callbacks.success();
        },
        error: function(textStatus, errorThrown) {
          Janus2.error(textStatus + ":", errorThrown);
          pluginHandles.delete(handleId);
          callbacks.success();
        }
      });
    }
    function createPeerconnectionIfNeeded(handleId, callbacks) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        throw "Invalid handle";
      }
      let config = pluginHandle.webrtcStuff;
      if (config.pc) {
        return;
      }
      let pc_config = {
        iceServers: typeof iceServers === "function" ? iceServers() : iceServers,
        iceTransportPolicy,
        bundlePolicy
      };
      pc_config.sdpSemantics = "unified-plan";
      let insertableStreams = false;
      if (callbacks.tracks) {
        for (let track of callbacks.tracks) {
          if (track.transforms && (track.transforms.sender || track.transforms.receiver)) {
            insertableStreams = true;
            break;
          }
        }
      }
      if (callbacks.externalEncryption) {
        insertableStreams = true;
        config.externalEncryption = true;
      }
      if (RTCRtpSender && (RTCRtpSender.prototype.createEncodedStreams || RTCRtpSender.prototype.createEncodedAudioStreams && RTCRtpSender.prototype.createEncodedVideoStreams) && insertableStreams) {
        config.insertableStreams = true;
        pc_config.forceEncodedAudioInsertableStreams = true;
        pc_config.forceEncodedVideoInsertableStreams = true;
        pc_config.encodedInsertableStreams = true;
      }
      Janus2.log("Creating PeerConnection");
      config.pc = new RTCPeerConnection(pc_config);
      Janus2.debug(config.pc);
      if (config.pc.getStats) {
        config.volume = {};
        config.bitrate.value = "0 kbits/sec";
      }
      Janus2.log("Preparing local SDP and gathering candidates (trickle=" + config.trickle + ")");
      config.pc.onconnectionstatechange = function() {
        if (config.pc)
          pluginHandle.connectionState(config.pc.connectionState);
      };
      config.pc.oniceconnectionstatechange = function() {
        if (config.pc)
          pluginHandle.iceState(config.pc.iceConnectionState);
      };
      config.pc.onicecandidate = function(event) {
        if (!event.candidate || event.candidate.candidate && event.candidate.candidate.indexOf("endOfCandidates") > 0) {
          Janus2.log("End of candidates.");
          config.iceDone = true;
          if (config.trickle === true) {
            sendTrickleCandidate(handleId, { completed: true });
          } else {
            sendSDP(handleId, callbacks);
          }
        } else {
          let candidate = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          };
          if (config.trickle === true) {
            sendTrickleCandidate(handleId, candidate);
          }
        }
      };
      config.pc.ontrack = function(event) {
        Janus2.log("Handling Remote Track", event);
        if (!event.streams)
          return;
        if (!event.track)
          return;
        let mid = event.transceiver ? event.transceiver.mid : event.track.id;
        try {
          if (event.transceiver && event.transceiver.mid && event.track.id) {
            if (!pluginHandle.mids)
              pluginHandle.mids = {};
            pluginHandle.mids[event.track.id] = event.transceiver.mid;
          }
          pluginHandle.onremotetrack(event.track, mid, true, { reason: "created" });
        } catch (e) {
          Janus2.error("Error calling onremotetrack", e);
        }
        if (event.track.onended)
          return;
        let trackMutedTimeoutId = null;
        Janus2.log("Adding onended callback to track:", event.track);
        event.track.onended = function(ev) {
          Janus2.log("Remote track removed:", ev);
          clearTimeout(trackMutedTimeoutId);
          let transceivers = config.pc ? config.pc.getTransceivers() : null;
          let transceiver = transceivers ? transceivers.find(
            (t) => t.receiver.track === ev.target
          ) : null;
          let mid2 = transceiver ? transceiver.mid : ev.target.id;
          if (mid2 === ev.target.id && pluginHandle.mids && pluginHandle.mids[event.track.id])
            mid2 = pluginHandle.mids[event.track.id];
          try {
            pluginHandle.onremotetrack(ev.target, mid2, false, { reason: "ended" });
          } catch (e) {
            Janus2.error("Error calling onremotetrack on removal", e);
          }
          delete pluginHandle.mids[event.track.id];
        };
        event.track.onmute = function(ev) {
          Janus2.log("Remote track muted:", ev);
          if (!trackMutedTimeoutId) {
            trackMutedTimeoutId = setTimeout(function() {
              Janus2.log("Removing remote track");
              let transceivers = config.pc ? config.pc.getTransceivers() : null;
              let transceiver = transceivers ? transceivers.find(
                (t) => t.receiver.track === ev.target
              ) : null;
              let mid2 = transceiver ? transceiver.mid : ev.target.id;
              if (mid2 === ev.target.id && pluginHandle.mids && pluginHandle.mids[event.track.id])
                mid2 = pluginHandle.mids[event.track.id];
              try {
                pluginHandle.onremotetrack(ev.target, mid2, false, { reason: "mute" });
              } catch (e) {
                Janus2.error("Error calling onremotetrack on mute", e);
              }
              trackMutedTimeoutId = null;
            }, 3 * 840);
          }
        };
        event.track.onunmute = function(ev) {
          Janus2.log("Remote track flowing again:", ev);
          if (trackMutedTimeoutId != null) {
            clearTimeout(trackMutedTimeoutId);
            trackMutedTimeoutId = null;
          } else {
            try {
              let transceivers = config.pc ? config.pc.getTransceivers() : null;
              let transceiver = transceivers ? transceivers.find(
                (t) => t.receiver.track === ev.target
              ) : null;
              let mid2 = transceiver ? transceiver.mid : ev.target.id;
              pluginHandle.onremotetrack(ev.target, mid2, true, { reason: "unmute" });
            } catch (e) {
              Janus2.error("Error calling onremotetrack on unmute", e);
            }
          }
        };
      };
    }
    async function prepareWebrtc(handleId, offer, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : webrtcError;
      let jsep = callbacks.jsep;
      if (offer && jsep) {
        Janus2.error("Provided a JSEP to a createOffer");
        callbacks.error("Provided a JSEP to a createOffer");
        return;
      } else if (!offer && (!jsep || !jsep.type || !jsep.sdp)) {
        Janus2.error("A valid JSEP is required for createAnswer");
        callbacks.error("A valid JSEP is required for createAnswer");
        return;
      }
      if (callbacks.media && !callbacks.tracks) {
        callbacks.tracks = Janus2.mediaToTracks(callbacks.media);
        if (callbacks.simulcast === true || callbacks.simulcast2 === true || callbacks.svc) {
          for (let track of callbacks.tracks) {
            if (track.type === "video") {
              if (callbacks.simulcast === true || callbacks.simulcast2 === true)
                track.simulcast = true;
              else if (callbacks.svc)
                track.svc = callbacks.svc;
              break;
            }
          }
        }
        Janus2.warn("Deprecated media object passed, use tracks instead. Automatically translated to:", callbacks.tracks);
      }
      if (callbacks.tracks && !Array.isArray(callbacks.tracks)) {
        Janus2.error("Tracks must be an array");
        callbacks.error("Tracks must be an array");
        return;
      }
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        callbacks.error("Invalid handle");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      config.trickle = isTrickleEnabled(callbacks.trickle);
      try {
        createPeerconnectionIfNeeded(handleId, callbacks);
        if (offer) {
          await captureDevices(handleId, callbacks);
        }
        if (!jsep) {
          let offer2 = await createOffer(handleId, callbacks);
          callbacks.success(offer2);
        } else {
          await config.pc.setRemoteDescription(jsep);
          Janus2.log("Remote description accepted!");
          config.remoteSdp = jsep.sdp;
          if (config.candidates && config.candidates.length > 0) {
            for (let i = 0; i < config.candidates.length; i++) {
              let candidate = config.candidates[i];
              Janus2.debug("Adding remote candidate:", candidate);
              if (!candidate || candidate.completed === true) {
                config.pc.addIceCandidate(Janus2.endOfCandidates);
              } else {
                config.pc.addIceCandidate(candidate);
              }
            }
            config.candidates = [];
          }
          await captureDevices(handleId, callbacks);
          let answer = await createAnswer(handleId, callbacks);
          callbacks.success(answer);
        }
      } catch (err) {
        Janus2.error(err);
        callbacks.error(err);
      }
    }
    function prepareWebrtcPeer(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : webrtcError;
      callbacks.customizeSdp = typeof callbacks.customizeSdp == "function" ? callbacks.customizeSdp : Janus2.noop;
      let jsep = callbacks.jsep;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        callbacks.error("Invalid handle");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      if (jsep) {
        if (!config.pc) {
          Janus2.warn("Wait, no PeerConnection?? if this is an answer, use createAnswer and not handleRemoteJsep");
          callbacks.error("No PeerConnection: if this is an answer, use createAnswer and not handleRemoteJsep");
          return;
        }
        callbacks.customizeSdp(jsep);
        config.pc.setRemoteDescription(jsep).then(function() {
          Janus2.log("Remote description accepted!");
          config.remoteSdp = jsep.sdp;
          if (config.candidates && config.candidates.length > 0) {
            for (let i = 0; i < config.candidates.length; i++) {
              let candidate = config.candidates[i];
              Janus2.debug("Adding remote candidate:", candidate);
              if (!candidate || candidate.completed === true) {
                config.pc.addIceCandidate(Janus2.endOfCandidates);
              } else {
                config.pc.addIceCandidate(candidate);
              }
            }
            config.candidates = [];
          }
          callbacks.success();
        }, callbacks.error);
      } else {
        callbacks.error("Invalid JSEP");
      }
    }
    async function createOffer(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.customizeSdp = typeof callbacks.customizeSdp == "function" ? callbacks.customizeSdp : Janus2.noop;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        throw "Invalid handle";
      }
      let config = pluginHandle.webrtcStuff;
      Janus2.log("Creating offer (iceDone=" + config.iceDone + ")");
      let mediaConstraints = {};
      let iceRestart = callbacks.iceRestart === true;
      if (iceRestart)
        mediaConstraints.iceRestart = true;
      Janus2.debug(mediaConstraints);
      let offer = await config.pc.createOffer(mediaConstraints);
      Janus2.debug(offer);
      let jsep = {
        type: "offer",
        sdp: offer.sdp
      };
      callbacks.customizeSdp(jsep);
      offer.sdp = jsep.sdp;
      Janus2.log("Setting local description");
      config.mySdp = {
        type: "offer",
        sdp: offer.sdp
      };
      await config.pc.setLocalDescription(offer);
      config.mediaConstraints = mediaConstraints;
      if (!config.iceDone && !config.trickle) {
        Janus2.log("Waiting for all candidates...");
        return null;
      }
      if (config.insertableStreams || config.externalEncryption)
        offer.e2ee = true;
      return offer;
    }
    async function createAnswer(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.customizeSdp = typeof callbacks.customizeSdp == "function" ? callbacks.customizeSdp : Janus2.noop;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        throw "Invalid handle";
      }
      let config = pluginHandle.webrtcStuff;
      Janus2.log("Creating answer (iceDone=" + config.iceDone + ")");
      let answer = await config.pc.createAnswer();
      Janus2.debug(answer);
      let jsep = {
        type: "answer",
        sdp: answer.sdp
      };
      callbacks.customizeSdp(jsep);
      answer.sdp = jsep.sdp;
      Janus2.log("Setting local description");
      config.mySdp = {
        type: "answer",
        sdp: answer.sdp
      };
      await config.pc.setLocalDescription(answer);
      if (!config.iceDone && !config.trickle) {
        Janus2.log("Waiting for all candidates...");
        return null;
      }
      if (config.insertableStreams || config.externalEncryption)
        answer.e2ee = true;
      return answer;
    }
    function sendSDP(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle, not sending anything");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      Janus2.log("Sending offer/answer SDP...");
      if (!config.mySdp) {
        Janus2.warn("Local SDP instance is invalid, not sending anything...");
        return;
      }
      config.mySdp = {
        type: config.pc.localDescription.type,
        sdp: config.pc.localDescription.sdp
      };
      if (config.trickle === false)
        config.mySdp["trickle"] = false;
      Janus2.debug(callbacks);
      config.sdpSent = true;
      callbacks.success(config.mySdp);
    }
    async function replaceTracks(handleId, callbacks) {
      callbacks = callbacks || {};
      callbacks.success = typeof callbacks.success == "function" ? callbacks.success : Janus2.noop;
      callbacks.error = typeof callbacks.error == "function" ? callbacks.error : Janus2.noop;
      if (callbacks.tracks && !Array.isArray(callbacks.tracks)) {
        Janus2.error("Tracks must be an array");
        callbacks.error("Tracks must be an array");
        return;
      }
      for (let track of callbacks.tracks) {
        if (track.add || !track.replace && !track.remove)
          track.replace = true;
      }
      try {
        await captureDevices(handleId, callbacks);
        callbacks.success();
      } catch (err) {
        Janus2.error(err);
        callbacks.error(err);
      }
    }
    async function captureDevices(handleId, callbacks) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle, not sending anything");
        throw "Invalid handle";
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        throw "Invalid PeerConnection";
      }
      let tracks = callbacks.tracks;
      if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
        return;
      }
      let openedConsentDialog = false;
      let groups = {};
      for (let track of tracks) {
        delete track.gumGroup;
        if (!track.type || !["audio", "video"].includes(track.type))
          continue;
        if (!track.capture || track.capture instanceof MediaStreamTrack)
          continue;
        let group = track.group ? track.group : "default";
        if (!groups[group])
          groups[group] = {};
        if (groups[group][track.type])
          continue;
        track.gumGroup = group;
        groups[group][track.type] = track;
      }
      let keys = Object.keys(groups);
      for (let key of keys) {
        let group = groups[key];
        if (!group.audio || !group.video) {
          if (group.audio)
            delete group.audio.gumGroup;
          if (group.video)
            delete group.video.gumGroup;
          delete groups[key];
        }
      }
      let answer = callbacks.jsep ? true : false;
      for (let track of tracks) {
        if (!track.type) {
          Janus2.warn("Missing track type:", track);
          continue;
        }
        if (track.type === "data") {
          if (config.pc.ondatachannel) {
            Janus2.warn("Data channel exists already, not creating another one");
            continue;
          }
          Janus2.log("Creating default data channel");
          createDataChannel(handleId, Janus2.dataChanDefaultLabel, null, false);
          config.pc.ondatachannel = function(event) {
            Janus2.log("Data channel created by Janus:", event);
            createDataChannel(handleId, event.channel.label, event.channel.protocol, event.channel);
          };
          continue;
        }
        if ((typeof track.add === "undefined" || track.add === null) && (typeof track.remove === "undefined" || track.remove === null) && (typeof track.replace === "undefined" || track.replace === null)) {
          track.add = true;
        }
        if (track.add && track.remove || track.add && track.remove && track.replace) {
          Janus2.warn("Conflicting actions for track, ignoring:", track);
          continue;
        }
        if (track.add && track.replace) {
          Janus2.warn("Both add and replace provided, falling back to replace:", track);
          delete track.add;
        } else if (track.remove && track.replace) {
          Janus2.warn("Both remove and replace provided, falling back to remove:", track);
          delete track.replace;
        }
        let kind = track.type;
        if (track.type === "screen")
          kind = "video";
        let transceiver = null, sender = null;
        if (track.mid) {
          transceiver = config.pc.getTransceivers().find((t) => t.mid === track.mid && t.receiver.track.kind === kind);
        } else if (!track.add) {
          transceiver = config.pc.getTransceivers().find((t) => t.receiver.track.kind === kind);
        }
        if (track.replace || track.remove) {
          if (!transceiver) {
            Janus2.warn("Couldn't find a transceiver for track:", track);
            continue;
          }
          if (!transceiver.sender) {
            Janus2.warn("No sender in the transceiver for track:", track);
            continue;
          }
          sender = transceiver.sender;
        }
        if (answer && !transceiver) {
          transceiver = config.pc.getTransceivers().find((t) => t.receiver.track.kind === kind);
          if (!transceiver) {
            Janus2.warn("Couldn't find a transceiver for track:", track);
            continue;
          }
        }
        let nt = null, trackId = null;
        if (track.remove || track.replace) {
          Janus2.log("Removing track from PeerConnection", track);
          trackId = sender.track ? sender.track.id : null;
          await sender.replaceTrack(null);
          if (trackId && config.myStream) {
            let rt = null;
            if (kind === "audio" && config.myStream.getAudioTracks() && config.myStream.getAudioTracks().length) {
              for (let t of config.myStream.getAudioTracks()) {
                if (t.id === trackId) {
                  rt = t;
                  Janus2.log("Removing audio track:", rt);
                }
              }
            } else if (kind === "video" && config.myStream.getVideoTracks() && config.myStream.getVideoTracks().length) {
              for (let t of config.myStream.getVideoTracks()) {
                if (t.id === trackId) {
                  rt = t;
                  Janus2.log("Removing video track:", rt);
                }
              }
            }
            if (rt) {
              try {
                config.myStream.removeTrack(rt);
                pluginHandle.onlocaltrack(rt, false);
              } catch (e) {
                Janus2.error("Error calling onlocaltrack on removal for renegotiation", e);
              }
              if (rt.dontStop !== true) {
                try {
                  rt.stop();
                } catch (e) {
                }
              }
            }
          }
        }
        if (track.capture) {
          if (track.gumGroup && groups[track.gumGroup] && groups[track.gumGroup].stream) {
            let stream = groups[track.gumGroup].stream;
            nt = track.type === "audio" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            delete groups[track.gumGroup].stream;
            delete groups[track.gumGroup];
            delete track.gumGroup;
          } else if (track.capture instanceof MediaStreamTrack) {
            nt = track.capture;
          } else {
            if (!openedConsentDialog) {
              openedConsentDialog = true;
              pluginHandle.consentDialog(true);
            }
            let constraints = Janus2.trackConstraints(track), stream = null;
            if (track.type === "audio" || track.type === "video") {
              if (track.gumGroup) {
                let otherType = track.type === "audio" ? "video" : "audio";
                if (groups[track.gumGroup] && groups[track.gumGroup][otherType]) {
                  let otherTrack = groups[track.gumGroup][otherType];
                  let otherConstraints = Janus2.trackConstraints(otherTrack);
                  constraints[otherType] = otherConstraints[otherType];
                }
              }
              try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (track.gumGroup && constraints.audio && constraints.video) {
                  groups[track.gumGroup].stream = stream;
                  delete track.gumGroup;
                }
              } catch (error) {
                throw error;
              }
            } else {
              stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            }
            nt = track.type === "audio" ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
          }
          if (track.replace) {
            await sender.replaceTrack(nt);
            let newDirection = "sendrecv";
            if (track.recv === false || transceiver.direction === "inactive" || transceiver.direction === "sendonly")
              newDirection = "sendonly";
            if (transceiver.setDirection)
              transceiver.setDirection(newDirection);
            else
              transceiver.direction = newDirection;
          } else {
            if (!config.myStream)
              config.myStream = new MediaStream();
            if (kind === "audio" || !track.simulcast && !track.svc) {
              sender = config.pc.addTrack(nt, config.myStream);
              transceiver = config.pc.getTransceivers().find((t) => t.sender === sender);
            } else if (track.simulcast) {
              if (Janus2.webRTCAdapter.browserDetails.browser !== "firefox") {
                Janus2.log("Enabling rid-based simulcasting:", nt);
                let maxBitrates = getMaxBitrates(track.simulcastMaxBitrates);
                transceiver = config.pc.addTransceiver(nt, {
                  direction: "sendrecv",
                  streams: [config.myStream],
                  sendEncodings: track.sendEncodings || [
                    { rid: "h", active: true, scalabilityMode: "L1T2", maxBitrate: maxBitrates.high },
                    { rid: "m", active: true, scalabilityMode: "L1T2", maxBitrate: maxBitrates.medium, scaleResolutionDownBy: 2 },
                    { rid: "l", active: true, scalabilityMode: "L1T2", maxBitrate: maxBitrates.low, scaleResolutionDownBy: 4 }
                  ]
                });
              } else {
                Janus2.log("Enabling Simulcasting for Firefox (RID)");
                transceiver = config.pc.addTransceiver(nt, {
                  direction: "sendrecv",
                  streams: [config.myStream]
                });
                sender = transceiver ? transceiver.sender : null;
                if (sender) {
                  let parameters = sender.getParameters();
                  if (!parameters)
                    parameters = {};
                  let maxBitrates = getMaxBitrates(track.simulcastMaxBitrates);
                  parameters.encodings = track.sendEncodings || [
                    { rid: "h", active: true, maxBitrate: maxBitrates.high },
                    { rid: "m", active: true, maxBitrate: maxBitrates.medium, scaleResolutionDownBy: 2 },
                    { rid: "l", active: true, maxBitrate: maxBitrates.low, scaleResolutionDownBy: 4 }
                  ];
                  sender.setParameters(parameters);
                }
              }
            } else {
              Janus2.log("Enabling SVC (" + track.svc + "):", nt);
              transceiver = config.pc.addTransceiver(nt, {
                direction: "sendrecv",
                streams: [config.myStream],
                sendEncodings: [
                  { scalabilityMode: track.svc }
                ]
              });
            }
            if (!sender)
              sender = transceiver ? transceiver.sender : null;
            if (track.codec) {
              if (Janus2.webRTCAdapter.browserDetails.browser === "firefox") {
                Janus2.warn("setCodecPreferences not supported in Firefox, ignoring codec for track:", track);
              } else if (typeof track.codec !== "string") {
                Janus2.warn("Invalid codec value, ignoring for track:", track);
              } else {
                let mimeType = kind + "/" + track.codec.toLowerCase();
                let codecs = RTCRtpReceiver.getCapabilities(kind).codecs.filter(function(codec) {
                  return codec.mimeType.toLowerCase() === mimeType;
                });
                if (!codecs || codecs.length === 0) {
                  Janus2.warn("Codec not supported in this browser for this track, ignoring:", track);
                } else if (transceiver) {
                  try {
                    transceiver.setCodecPreferences(codecs);
                  } catch (err) {
                    Janus2.warn("Failed enforcing codec for this " + kind + " track:", err);
                  }
                }
              }
            }
            if (track.bitrate) {
              if (track.simulcast || track.svc) {
                Janus2.warn("Ignoring bitrate for simulcast/SVC track, use sendEncodings for that");
              } else if (isNaN(track.bitrate) || track.bitrate < 0) {
                Janus2.warn("Ignoring invalid bitrate for track:", track);
              } else if (sender) {
                let params = sender.getParameters();
                if (!params || !params.encodings || params.encodings.length === 0) {
                  Janus2.warn("No encodings in the sender parameters, ignoring bitrate for track:", track);
                } else {
                  params.encodings[0].maxBitrate = track.bitrate;
                  await sender.setParameters(params);
                }
              }
            }
            if (kind === "video" && track.framerate) {
              if (track.simulcast || track.svc) {
                Janus2.warn("Ignoring framerate for simulcast/SVC track, use sendEncodings for that");
              } else if (isNaN(track.framerate) || track.framerate < 0) {
                Janus2.warn("Ignoring invalid framerate for track:", track);
              } else if (sender) {
                let params = sender.getParameters();
                if (!params || !params.encodings || params.encodings.length === 0) {
                  Janus2.warn("No encodings in the sender parameters, ignoring framerate for track:", track);
                } else {
                  params.encodings[0].maxFramerate = track.framerate;
                  await sender.setParameters(params);
                }
              }
            }
            if (track.transforms) {
              if (sender && track.transforms.sender) {
                let senderStreams = null;
                if (RTCRtpSender.prototype.createEncodedStreams) {
                  senderStreams = sender.createEncodedStreams();
                } else if (RTCRtpSender.prototype.createAudioEncodedStreams || RTCRtpSender.prototype.createEncodedVideoStreams) {
                  if (kind === "audio") {
                    senderStreams = sender.createEncodedAudioStreams();
                  } else if (kind === "video") {
                    senderStreams = sender.createEncodedVideoStreams();
                  }
                }
                if (senderStreams) {
                  console.log("Insertable Streams sender transform:", senderStreams);
                  if (senderStreams.readableStream && senderStreams.writableStream) {
                    senderStreams.readableStream.pipeThrough(track.transforms.sender).pipeTo(senderStreams.writableStream);
                  } else if (senderStreams.readable && senderStreams.writable) {
                    senderStreams.readable.pipeThrough(track.transforms.sender).pipeTo(senderStreams.writable);
                  }
                }
              }
              if (transceiver && transceiver.receiver && track.transforms.receiver) {
                let receiverStreams = null;
                if (RTCRtpReceiver.prototype.createEncodedStreams) {
                  receiverStreams = transceiver.receiver.createEncodedStreams();
                } else if (RTCRtpReceiver.prototype.createAudioEncodedStreams || RTCRtpReceiver.prototype.createEncodedVideoStreams) {
                  if (kind === "audio") {
                    receiverStreams = transceiver.receiver.createEncodedAudioStreams();
                  } else if (kind === "video") {
                    receiverStreams = transceiver.receiver.createEncodedVideoStreams();
                  }
                }
                if (receiverStreams) {
                  console.log("Insertable Streams receiver transform:", receiverStreams);
                  if (receiverStreams.readableStream && receiverStreams.writableStream) {
                    receiverStreams.readableStream.pipeThrough(track.transforms.receiver).pipeTo(receiverStreams.writableStream);
                  } else if (receiverStreams.readable && receiverStreams.writable) {
                    receiverStreams.readable.pipeThrough(track.transforms.receiver).pipeTo(receiverStreams.writable);
                  }
                }
              }
            }
          }
          if (nt && track.dontStop === true)
            nt.dontStop = true;
        } else if (track.recv) {
          if (!transceiver)
            transceiver = config.pc.addTransceiver(kind);
          if (transceiver) {
            if (track.codec) {
              if (Janus2.webRTCAdapter.browserDetails.browser === "firefox") {
                Janus2.warn("setCodecPreferences not supported in Firefox, ignoring codec for track:", track);
              } else if (typeof track.codec !== "string") {
                Janus2.warn("Invalid codec value, ignoring for track:", track);
              } else {
                let mimeType = kind + "/" + track.codec.toLowerCase();
                let codecs = RTCRtpReceiver.getCapabilities(kind).codecs.filter(function(codec) {
                  return codec.mimeType.toLowerCase() === mimeType;
                });
                if (!codecs || codecs.length === 0) {
                  Janus2.warn("Codec not supported in this browser for this track, ignoring:", track);
                } else {
                  try {
                    transceiver.setCodecPreferences(codecs);
                  } catch (err) {
                    Janus2.warn("Failed enforcing codec for this " + kind + " track:", err);
                  }
                }
              }
            }
            if (transceiver.receiver && track.transforms && track.transforms.receiver) {
              let receiverStreams = null;
              if (RTCRtpReceiver.prototype.createEncodedStreams) {
                receiverStreams = transceiver.receiver.createEncodedStreams();
              } else if (RTCRtpReceiver.prototype.createAudioEncodedStreams || RTCRtpReceiver.prototype.createEncodedVideoStreams) {
                if (kind === "audio") {
                  receiverStreams = transceiver.receiver.createEncodedAudioStreams();
                } else if (kind === "video") {
                  receiverStreams = transceiver.receiver.createEncodedVideoStreams();
                }
              }
              if (receiverStreams) {
                console.log("Insertable Streams receiver transform:", receiverStreams);
                if (receiverStreams.readableStream && receiverStreams.writableStream) {
                  receiverStreams.readableStream.pipeThrough(track.transforms.receiver).pipeTo(receiverStreams.writableStream);
                } else if (receiverStreams.readable && receiverStreams.writable) {
                  receiverStreams.readable.pipeThrough(track.transforms.receiver).pipeTo(receiverStreams.writable);
                }
              }
            }
          }
        }
        if (nt) {
          config.myStream.addTrack(nt);
          nt.onended = function(ev) {
            Janus2.log("Local track removed:", ev);
            try {
              pluginHandle.onlocaltrack(ev.target, false);
            } catch (e) {
              Janus2.error("Error calling onlocaltrack following end", e);
            }
          };
          try {
            pluginHandle.onlocaltrack(nt, true);
          } catch (e) {
            Janus2.error("Error calling onlocaltrack for track add", e);
          }
        }
        if (transceiver) {
          let curdir = transceiver.direction, newdir = null;
          let send = nt && transceiver.sender.track, recv = track.recv !== false && transceiver.receiver.track;
          if (send && recv)
            newdir = "sendrecv";
          else if (send && !recv)
            newdir = "sendonly";
          else if (!send && recv)
            newdir = "recvonly";
          else if (!send && !recv)
            newdir = "inactive";
          if (newdir && newdir !== curdir) {
            Janus2.warn("Changing direction of transceiver to " + newdir + " (was " + curdir + ")", track);
            if (transceiver.setDirection)
              transceiver.setDirection(newdir);
            else
              transceiver.direction = newdir;
          }
        }
      }
      if (openedConsentDialog)
        pluginHandle.consentDialog(false);
    }
    function getLocalTracks(handleId) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return null;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        return null;
      }
      let tracks = [];
      let transceivers = config.pc.getTransceivers();
      for (let tr of transceivers) {
        let track = null;
        if (tr.sender && tr.sender.track) {
          track = { mid: tr.mid };
          track.type = tr.sender.track.kind;
          track.id = tr.sender.track.id;
          track.label = tr.sender.track.label;
        }
        if (track)
          tracks.push(track);
      }
      return tracks;
    }
    function getRemoteTracks(handleId) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return null;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        return null;
      }
      let tracks = [];
      let transceivers = config.pc.getTransceivers();
      for (let tr of transceivers) {
        let track = null;
        if (tr.receiver && tr.receiver.track) {
          track = { mid: tr.mid };
          track.type = tr.receiver.track.kind;
          track.id = tr.receiver.track.id;
          track.label = tr.receiver.track.label;
        }
        if (track)
          tracks.push(track);
      }
      return tracks;
    }
    function getVolume(handleId, mid, remote, result) {
      result = typeof result == "function" ? result : Janus2.noop;
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        result(0);
        return;
      }
      let stream = remote ? "remote" : "local";
      let config = pluginHandle.webrtcStuff;
      if (!config.volume[stream])
        config.volume[stream] = { value: 0 };
      if (config.pc && config.pc.getStats && (Janus2.webRTCAdapter.browserDetails.browser === "chrome" || Janus2.webRTCAdapter.browserDetails.browser === "safari")) {
        let query = config.pc;
        if (mid) {
          let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track.kind === "audio");
          if (!transceiver) {
            Janus2.warn("No audio transceiver with mid " + mid);
            result(0);
            return;
          }
          if (remote && !transceiver.receiver) {
            Janus2.warn("Remote transceiver track unavailable");
            result(0);
            return;
          } else if (!remote && !transceiver.sender) {
            Janus2.warn("Local transceiver track unavailable");
            result(0);
            return;
          }
          query = remote ? transceiver.receiver : transceiver.sender;
        }
        query.getStats().then(function(stats) {
          stats.forEach(function(res) {
            if (!res || res.kind !== "audio")
              return;
            if (remote && !res.remoteSource || !remote && res.type !== "media-source")
              return;
            result(res.audioLevel ? res.audioLevel : 0);
          });
        });
        return config.volume[stream].value;
      } else {
        Janus2.warn("Getting the " + stream + " volume unsupported by browser");
        result(0);
        return;
      }
    }
    function isMuted(handleId, mid, video) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return true;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        return true;
      }
      if (!config.myStream) {
        Janus2.warn("Invalid local MediaStream");
        return true;
      }
      if (video) {
        if (!config.myStream.getVideoTracks() || config.myStream.getVideoTracks().length === 0) {
          Janus2.warn("No video track");
          return true;
        }
        if (mid) {
          let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track.kind === "video");
          if (!transceiver) {
            Janus2.warn("No video transceiver with mid " + mid);
            return true;
          }
          if (!transceiver.sender || !transceiver.sender.track) {
            Janus2.warn("No video sender with mid " + mid);
            return true;
          }
          return !transceiver.sender.track.enabled;
        } else {
          return !config.myStream.getVideoTracks()[0].enabled;
        }
      } else {
        if (!config.myStream.getAudioTracks() || config.myStream.getAudioTracks().length === 0) {
          Janus2.warn("No audio track");
          return true;
        }
        if (mid) {
          let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track.kind === "audio");
          if (!transceiver) {
            Janus2.warn("No audio transceiver with mid " + mid);
            return true;
          }
          if (!transceiver.sender || !transceiver.sender.track) {
            Janus2.warn("No audio sender with mid " + mid);
            return true;
          }
          return !transceiver.sender.track.enabled;
        } else {
          return !config.myStream.getAudioTracks()[0].enabled;
        }
      }
    }
    function mute(handleId, mid, video, mute2) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return false;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        return false;
      }
      if (!config.myStream) {
        Janus2.warn("Invalid local MediaStream");
        return false;
      }
      if (video) {
        if (!config.myStream.getVideoTracks() || config.myStream.getVideoTracks().length === 0) {
          Janus2.warn("No video track");
          return false;
        }
        if (mid) {
          let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track.kind === "video");
          if (!transceiver) {
            Janus2.warn("No video transceiver with mid " + mid);
            return false;
          }
          if (!transceiver.sender || !transceiver.sender.track) {
            Janus2.warn("No video sender with mid " + mid);
            return false;
          }
          transceiver.sender.track.enabled = mute2 ? false : true;
        } else {
          for (const videostream of config.myStream.getVideoTracks()) {
            videostream.enabled = !mute2;
          }
        }
      } else {
        if (!config.myStream.getAudioTracks() || config.myStream.getAudioTracks().length === 0) {
          Janus2.warn("No audio track");
          return false;
        }
        if (mid) {
          let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track.kind === "audio");
          if (!transceiver) {
            Janus2.warn("No audio transceiver with mid " + mid);
            return false;
          }
          if (!transceiver.sender || !transceiver.sender.track) {
            Janus2.warn("No audio sender with mid " + mid);
            return false;
          }
          transceiver.sender.track.enabled = mute2 ? false : true;
        } else {
          for (const audiostream of config.myStream.getAudioTracks()) {
            audiostream.enabled = !mute2;
          }
        }
      }
      return true;
    }
    async function getConnectionStatus(pc) {
      const iceState = pc.iceConnectionState;
      const isConnected = iceState === "connected" || iceState === "completed";
      if (!isConnected) return { enabled: false, type: null };
      try {
        const stats = await pc.getStats();
        let selectedPair = null;
        let localCandidate = null;
        let remoteCandidate = null;
        for (const report of stats.values()) {
          if (report.type === "candidate-pair" && (report.state === "succeeded" || report.nominated)) {
            selectedPair = report;
            localCandidate = stats.get(report.localCandidateId);
            remoteCandidate = stats.get(report.remoteCandidateId);
            break;
          }
          if (report.type === "transport" && report.selectedCandidatePairId) {
            selectedPair = stats.get(report.selectedCandidatePairId);
            if (selectedPair) {
              localCandidate = stats.get(selectedPair.localCandidateId);
              remoteCandidate = stats.get(selectedPair.remoteCandidateId);
              break;
            }
          }
        }
        if (!selectedPair) {
          return { enabled: true, type: null };
        }
        const isRelay = [localCandidate, remoteCandidate].some((candidate) => {
          if (!candidate) return false;
          return candidate.candidateType === "relay" || // Chrome
          candidate.candidateType === "relayed" || // Firefox
          candidate.type === "relay" || // 备用字段
          candidate.ip && candidate.ip.includes("turn");
        });
        return {
          enabled: true,
          type: isRelay ? "relay" : "p2p"
        };
      } catch (error) {
        return { enabled: false, type: null };
      }
    }
    async function getRtcStats(handleId, mid) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return { message: "Invalid handle" };
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc)
        return { message: "Invalid PeerConnection" };
      if (config.pc.getStats) {
        const res = await getConnectionStatus(config.pc);
        return res;
      } else {
        Janus2.warn("Getting the video bitrate unsupported by browser");
        return { message: "Feature unsupported by browser" };
      }
    }
    function getBitrate(handleId, mid) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return "Invalid handle";
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc)
        return "Invalid PeerConnection";
      if (config.pc.getStats) {
        let query = config.pc;
        let target = mid ? mid : "default";
        if (mid) {
          let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid && t.receiver.track.kind === "video");
          if (!transceiver) {
            Janus2.warn("No video transceiver with mid " + mid);
            return "No video transceiver with mid " + mid;
          }
          if (!transceiver.receiver) {
            Janus2.warn("No video receiver with mid " + mid);
            return "No video receiver with mid " + mid;
          }
          query = transceiver.receiver;
        }
        if (!config.bitrate[target]) {
          config.bitrate[target] = {
            timer: null,
            bsnow: null,
            bsbefore: null,
            tsnow: null,
            tsbefore: null,
            value: "0 kbits/sec"
          };
        }
        if (!config.bitrate[target].timer) {
          Janus2.log("Starting bitrate timer" + (mid ? " for mid " + mid : "") + " (via getStats)");
          config.bitrate[target].timer = setInterval(function() {
            query.getStats().then(function(stats) {
              stats.forEach(function(res) {
                if (!res)
                  return;
                let inStats = false;
                if ((res.mediaType === "video" || res.kind === "video" || res.id.toLowerCase().indexOf("video") > -1) && res.type === "inbound-rtp" && res.id.indexOf("rtcp") < 0) {
                  inStats = true;
                } else if (res.type == "ssrc" && res.bytesReceived && (res.googCodecName === "VP8" || res.googCodecName === "")) {
                  inStats = true;
                }
                if (inStats) {
                  config.bitrate[target].bsnow = res.bytesReceived;
                  config.bitrate[target].tsnow = res.timestamp;
                  if (config.bitrate[target].bsbefore === null || config.bitrate[target].tsbefore === null) {
                    config.bitrate[target].bsbefore = config.bitrate[target].bsnow;
                    config.bitrate[target].tsbefore = config.bitrate[target].tsnow;
                  } else {
                    let timePassed = config.bitrate[target].tsnow - config.bitrate[target].tsbefore;
                    if (Janus2.webRTCAdapter.browserDetails.browser === "safari")
                      timePassed = timePassed / 1e3;
                    let bitRate = Math.round((config.bitrate[target].bsnow - config.bitrate[target].bsbefore) * 8 / timePassed);
                    if (Janus2.webRTCAdapter.browserDetails.browser === "safari")
                      bitRate = parseInt(bitRate / 1e3);
                    config.bitrate[target].value = bitRate + " kbits/sec";
                    config.bitrate[target].bsbefore = config.bitrate[target].bsnow;
                    config.bitrate[target].tsbefore = config.bitrate[target].tsnow;
                  }
                }
              });
            });
          }, 1e3);
          return "0 kbits/sec";
        }
        return config.bitrate[target].value;
      } else {
        Janus2.warn("Getting the video bitrate unsupported by browser");
        return "Feature unsupported by browser";
      }
    }
    function setBitrate(handleId, mid, bitrate) {
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle || !pluginHandle.webrtcStuff) {
        Janus2.warn("Invalid handle");
        return;
      }
      let config = pluginHandle.webrtcStuff;
      if (!config.pc) {
        Janus2.warn("Invalid PeerConnection");
        return;
      }
      let transceiver = config.pc.getTransceivers().find((t) => t.mid === mid);
      if (!transceiver) {
        Janus2.warn("No transceiver with mid", mid);
        return;
      }
      if (!transceiver.sender) {
        Janus2.warn("No sender for transceiver with mid", mid);
        return;
      }
      let params = transceiver.sender.getParameters();
      if (!params || !params.encodings || params.encodings.length === 0) {
        Janus2.warn("No parameters encodings");
      } else if (params.encodings.length > 1) {
        Janus2.warn("Ignoring bitrate for simulcast track, use sendEncodings for that");
      } else if (isNaN(bitrate) || bitrate < 0) {
        Janus2.warn("Invalid bitrate (must be a positive integer)");
      } else {
        params.encodings[0].maxBitrate = bitrate;
        transceiver.sender.setParameters(params);
      }
    }
    function webrtcError(error) {
      Janus2.error("WebRTC error:", error);
    }
    function cleanupWebrtc(handleId, hangupRequest) {
      Janus2.log("Cleaning WebRTC stuff");
      let pluginHandle = pluginHandles.get(handleId);
      if (!pluginHandle) {
        return;
      }
      let config = pluginHandle.webrtcStuff;
      if (config) {
        if (hangupRequest === true) {
          let request = { "janus": "hangup", "transaction": Janus2.randomString(12) };
          if (pluginHandle.token)
            request["token"] = pluginHandle.token;
          if (apisecret)
            request["apisecret"] = apisecret;
          Janus2.debug("Sending hangup request (handle=" + handleId + "):");
          Janus2.debug(request);
          if (websockets) {
            request["session_id"] = sessionId;
            request["handle_id"] = handleId;
            ws.send(JSON.stringify(request));
          } else {
            Janus2.httpAPICall(server + "/" + sessionId + "/" + handleId, {
              verb: "POST",
              withCredentials,
              body: request
            });
          }
        }
        if (config.volume) {
          if (config.volume["local"] && config.volume["local"].timer)
            clearInterval(config.volume["local"].timer);
          if (config.volume["remote"] && config.volume["remote"].timer)
            clearInterval(config.volume["remote"].timer);
        }
        for (let i in config.bitrate) {
          if (config.bitrate[i].timer)
            clearInterval(config.bitrate[i].timer);
        }
        config.bitrate = {};
        if (!config.streamExternal && config.myStream) {
          Janus2.log("Stopping local stream tracks");
          Janus2.stopAllTracks(config.myStream);
        }
        config.streamExternal = false;
        config.myStream = null;
        try {
          config.pc.close();
        } catch (e) {
        }
        config.pc = null;
        config.candidates = null;
        config.mySdp = null;
        config.remoteSdp = null;
        config.iceDone = false;
        config.dataChannel = {};
        config.dtmfSender = null;
        config.insertableStreams = false;
        config.externalEncryption = false;
      }
      pluginHandle.oncleanup();
    }
    function isTrickleEnabled(trickle) {
      Janus2.debug("isTrickleEnabled:", trickle);
      return trickle === false ? false : true;
    }
  }
  return Janus2;
});
const $ = (id) => document.getElementById(id);
const nullFn = () => {
};
class JanusStreamer {
  // private meter: ReturnType<typeof createVolumeMeter>
  constructor(kvm, el, config, allow_audio, allow_video = true, onRemoteTrack, onLocalTrack, onSdpStatus) {
    this.kvm = kvm;
    this.el = el;
    this.allow_audio = allow_audio;
    this.allow_video = allow_video;
    this.onRemoteTrack = onRemoteTrack;
    this.onLocalTrack = onLocalTrack;
    this.onSdpStatus = onSdpStatus;
    this.setActive = config.setActive || nullFn;
    this.setInactive = config.setInactive || nullFn;
    this.setInfo = config.setInfo || nullFn;
    this.rtcConfig = config.rtcConfig;
    this.initJanus(() => {
      this.ensureJanus();
    });
  }
  _Janus;
  janus;
  handle;
  /** 是否是手动停止了janus */
  stop = false;
  ensuring = false;
  retry_ensure_timeout = null;
  retry_emsg_timeout = null;
  info_interval = null;
  state = null;
  frames = 0;
  setActive = nullFn;
  setInactive = nullFn;
  setInfo = nullFn;
  rtcConfig;
  allow_mic;
  allow_camera;
  connectionType;
  micTrack;
  ensureStream() {
    this.ensureJanus();
  }
  initJanus(callback) {
    Janus.init({
      debug: "all",
      id: this.kvm.id,
      callback: () => {
        this._Janus = Janus;
        callback();
      }
    });
  }
  attachJanus() {
    const { janus } = this;
    if (janus === null) {
      return;
    }
    janus.attach({
      plugin: "janus.plugin.ustreamer",
      opaqueId: "oid-" + this._Janus.randomString(12),
      success: (handle) => {
        this.handle = handle;
        this.sendWatch();
      },
      error: (error) => {
        this.setInfo(false, false, error);
        this.destroyJanus();
      },
      connectionState: (state) => {
        if (state === "failed") {
          this.destroyJanus();
        }
      },
      iceState: (state) => {
      },
      webrtcState: (up) => {
        if (up) {
          this.sendKeyRequired();
        }
      },
      onmessage: (msg, jsep) => {
        this.stopRetryEmsgInterval();
        if (msg.result) {
          if (msg.result.status === "started") {
            this.setActive();
            this.setInfo(false, false, "");
          } else if (msg.result.status === "stopped") {
            this.setInactive();
            this.setInfo(false, false, "");
          } else if (msg.result.status === "features") ;
        } else if (msg.error_code || msg.error) {
          this.setInfo(false, false, msg.error);
          if (this.retry_emsg_timeout === null) {
            this.retry_emsg_timeout = setTimeout(() => {
              if (!this.stop) {
                this.sendStop();
                this.sendWatch();
              }
              this.retry_emsg_timeout = null;
            }, 2e3);
          }
          return;
        } else {
          log("Got uStreamer other message:", msg);
        }
        if (jsep) {
          const tracks = [{ type: "video", capture: this.allow_camera, recv: true, add: true }];
          if (this.allow_audio || this.allow_mic) {
            tracks.push({
              type: "audio",
              capture: this.allow_mic,
              recv: this.allow_audio,
              add: true
            });
          }
          this.handle.createAnswer({
            jsep,
            tracks,
            // media: { audioSend: false, videoSend: false, data: false },
            // Chrome is playing OPUS as mono without this hack
            //   - https://issues.webrtc.org/issues/41481053 - IT'S NOT FIXED!
            //   - https://github.com/ossrs/srs/pull/2683/files
            customizeSdp: (jsep2) => {
              jsep2.sdp = jsep2.sdp.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
            },
            success: (jsep2) => {
              this.sendStart(jsep2);
              this.onSdpStatus?.(true);
            },
            error: (error) => {
              this.onSdpStatus?.(false);
              this.setInfo(false, false, error);
              this.destroyJanus();
            }
          });
        }
      },
      // Janus 1.x
      onremotetrack: (track, id, added, meta) => {
        const reason = (meta || {}).reason;
        if (added && reason === "created") {
          this.addTrack(track);
          if (track.kind === "video") {
            this.sendKeyRequired();
            this.startInfoInterval();
            this.getConnectionType();
          }
        } else if (!added && reason === "ended") {
          this.removeTrack(track);
        }
      },
      onlocaltrack: (track) => {
      },
      oncleanup: () => {
        this.stopInfoInterval();
      }
    });
  }
  async getConnectionType() {
    try {
      const res = await this.handle.getRtcStats();
      if (res.enabled) {
        this.connectionType = res.type;
      }
      await Er(5e3);
      this.getConnectionType();
    } catch (error) {
      await Er(5e3);
      this.getConnectionType();
    }
  }
  setMicEnabled(enabled) {
    if (this.micTrack) {
      this.micTrack.enabled = enabled;
      return true;
    }
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ensureJanus() {
    log("ensureJanus", this.kvm);
    const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
    const config = {
      server: `${wsProtocol}://localhost:4004/kvm-api/${this.kvm.id}/janus/ws`,
      success: () => {
        this.attachJanus();
      },
      ...this.rtcConfig || {},
      // 第二个参数可选，如果传了，就用这个code去翻译，没传就用err
      error: (err) => {
        const errorEnum = JANUS_ERROR_TO_JANUS_ENUM_MAP.get(err);
        if (errorEnum !== void 0) {
          this.setInfo(false, false, "error." + errorEnum);
        } else {
          this.setInfo(false, false, err);
        }
        this.__finishJanus();
      },
      destroyOnUnload: false
    };
    log("WebRTC Config: ", config);
    this.janus = new this._Janus(config);
  }
  destroyJanus() {
    try {
      if (this.janus !== null) {
        this.janus.destroy();
      }
      this.__finishJanus();
      const stream = this.el.srcObject;
      if (stream) {
        for (const track of stream.getTracks()) {
          this.removeTrack(track);
        }
      }
    } catch (error) {
    }
  }
  stopStream() {
    this.stop = true;
    this.destroyJanus();
  }
  __finishJanus() {
    if (this.stop) {
      if (this.retry_ensure_timeout !== null) {
        clearTimeout(this.retry_ensure_timeout);
        this.retry_ensure_timeout = null;
      }
      this.ensuring = false;
    } else {
      if (this.retry_ensure_timeout === null) {
        this.retry_ensure_timeout = setTimeout(() => {
          this.retry_ensure_timeout = null;
          this.ensureJanus();
        }, 5e3);
      }
    }
    this.stopRetryEmsgInterval();
    this.stopInfoInterval();
    if (this.handle) {
      this.handle.detach();
      this.handle = null;
    }
    this.janus = null;
    this.setInactive();
    if (this.stop) {
      this.setInfo(false, false, "");
    }
  }
  stopRetryEmsgInterval() {
    if (this.retry_emsg_timeout !== null) {
      clearTimeout(this.retry_emsg_timeout);
      this.retry_emsg_timeout = null;
    }
  }
  stopInfoInterval() {
    if (this.info_interval !== null) {
      clearInterval(this.info_interval);
    }
    this.info_interval = null;
  }
  isOnline() {
  }
  sendKeyRequired() {
  }
  startInfoInterval() {
    this.stopInfoInterval();
    this.setActive();
    this.updateInfo();
    this.info_interval = setInterval(() => this.updateInfo(), 1e3);
  }
  updateInfo() {
    try {
      if (this.handle !== null) {
        let info = "";
        let fps = null;
        if (this.handle !== null) {
          let frames = null;
          const el = this.el;
          if (el.webkitDecodedFrameCount !== void 0) {
            frames = el.webkitDecodedFrameCount;
          } else if (el.mozPaintedFrames !== void 0) {
            frames = el.mozPaintedFrames;
          }
          info = `${this.handle.getBitrate()}`.replace("kbits/sec", "kbps");
          if (frames !== null) {
            fps = Math.max(0, frames - this.frames);
            info += ` / ${fps} fps dynamic`;
            this.frames = frames;
          }
        }
        this.setInfo(true, this.isOnline(), info, { fps, connectionType: this.connectionType });
      }
    } catch (error) {
    }
  }
  sendStop() {
    this.stopInfoInterval();
    if (this.handle) {
      this.handle.send({ message: { request: "stop" } });
      this.handle.hangup();
    }
  }
  sendWatch() {
    if (this.handle) {
      this.handle.send({ message: { request: "features" } });
      log("send watch: ", {
        orientation: this.getOrientation(),
        audio: this.allow_audio || this.allow_mic,
        video: this.allow_video,
        mic: this.allow_mic,
        camera: this.allow_camera
      });
      this.handle.send({
        message: {
          request: "watch",
          params: {
            orientation: this.getOrientation(),
            audio: this.allow_audio || this.allow_mic,
            video: this.allow_video,
            mic: this.allow_mic,
            camera: this.allow_camera
          }
        }
      });
    }
  }
  addTrack(track, el = this.el) {
    if (el.srcObject) {
      for (const tr of el.srcObject.getTracks()) {
        if (tr.kind === track.kind && tr.id !== track.id) {
          this.removeTrack(tr);
        }
      }
    }
    if (!el.srcObject) {
      el.srcObject = new MediaStream();
      this.onRemoteTrack?.();
    }
    el.srcObject.addTrack(track);
  }
  removeTrack(track) {
    const el = this.el;
    if (!el.srcObject) {
      return;
    }
    track.stop();
    el.srcObject.removeTrack(track);
    if (el.srcObject.getTracks().length === 0) {
      el.srcObject = null;
    }
  }
  sendStart(jsep) {
    if (this.handle) {
      this.handle.send({ message: { request: "start" }, jsep });
    }
  }
  getOrientation() {
  }
  isAudioAllowed() {
    return this.allow_audio;
  }
  getName() {
    let name = "WebRTC H.264";
    if (this.allow_audio) {
      name += " + Audio";
    }
    if (this.allow_mic) {
      name += " + Mic";
    }
    return name;
  }
  getMode() {
    return "janus";
  }
  getResolution() {
    if (this.el instanceof HTMLVideoElement) {
      const el = this.el;
      return {
        real_width: el.videoWidth || el.offsetWidth,
        real_height: el.videoHeight || el.offsetHeight,
        view_width: el.offsetWidth,
        view_height: el.offsetHeight
      };
    }
  }
}
const __ascii_encoder = new TextEncoder("ascii");
function sendHidEvent(ws, { event_type, event }) {
  if (!ws) {
    return;
  }
  if (event_type == "key") {
    const data = __ascii_encoder.encode("\0" + event.key);
    data[1] = event.state ? 1 : 0;
    ws.send(data);
  } else if (event_type == "mouse_button") {
    const data = __ascii_encoder.encode("\0" + event.button);
    data[1] = event.state ? 1 : 0;
    ws.send(data);
  } else if (event_type == "mouse_move") {
    const data = new Uint8Array([
      3,
      event.to.x >> 8 & 255,
      event.to.x & 255,
      event.to.y >> 8 & 255,
      event.to.y & 255
    ]);
    ws.send(data);
  } else if (event_type == "mouse_relative" || event_type == "mouse_wheel") {
    let data;
    if (Array.isArray(event.delta)) {
      data = new Int8Array(2 + event.delta.length * 2);
      let index = 0;
      for (const delta of event.delta) {
        data[index + 2] = delta["x"];
        data[index + 3] = delta["y"];
        index += 2;
      }
    } else {
      data = new Int8Array([0, 0, event.delta.x, event.delta.y]);
    }
    data[0] = event_type == "mouse_relative" ? 4 : 5;
    data[1] = event.squash ? 1 : 0;
    ws.send(data);
  }
}
function remap(x2, a1, b1, a2, b2) {
  const remapped = Math.round((x2 - a1) / b1 * (b2 - a2) + a2);
  if (remapped < a2) {
    return a2;
  } else if (remapped > b2) {
    return b2;
  }
  return remapped;
}
function getResolution(el) {
  if (el instanceof HTMLVideoElement) {
    return {
      real_width: el.videoWidth || el.offsetWidth,
      real_height: el.videoHeight || el.offsetHeight,
      view_width: el.offsetWidth,
      view_height: el.offsetHeight
    };
  } else {
    return {
      real_width: el.width || el.offsetWidth,
      real_height: el.height || el.offsetHeight,
      view_width: el.offsetWidth,
      view_height: el.offsetHeight
    };
  }
}
function getGeometry(id) {
  const el = $(id);
  const res = getResolution(el);
  const ratio = Math.min(res.view_width / res.real_width, res.view_height / res.real_height);
  return {
    x: Math.round((res.view_width - ratio * res.real_width) / 2),
    y: Math.round((res.view_height - ratio * res.real_height) / 2),
    width: Math.round(ratio * res.real_width),
    height: Math.round(ratio * res.real_height),
    real_width: res.real_width,
    real_height: res.real_height
  };
}
const DEFAULT_MOUSE_POLLING = 10;
const DEFAULT_RELATIVE_SENSE = 10;
var Keymaps = /* @__PURE__ */ ((Keymaps2) => {
  Keymaps2["AR"] = "ar";
  Keymaps2["BEPO"] = "bepo";
  Keymaps2["CZ"] = "cz";
  Keymaps2["DA"] = "da";
  Keymaps2["DE"] = "de";
  Keymaps2["DE_CH"] = "de-ch";
  Keymaps2["EN_GB"] = "en-gb";
  Keymaps2["EN_US"] = "en-us";
  Keymaps2["EN_US_ALTGR_INTL"] = "en-us-altgr-intl";
  Keymaps2["ES"] = "es";
  Keymaps2["ET"] = "et";
  Keymaps2["FI"] = "fi";
  Keymaps2["FO"] = "fo";
  Keymaps2["FR"] = "fr";
  Keymaps2["FR_BE"] = "fr-be";
  Keymaps2["FR_CA"] = "fr-ca";
  Keymaps2["FR_CH"] = "fr-ch";
  Keymaps2["HR"] = "hr";
  Keymaps2["HU"] = "hu";
  Keymaps2["IS"] = "is";
  Keymaps2["IT"] = "it";
  Keymaps2["JA"] = "ja";
  Keymaps2["LT"] = "lt";
  Keymaps2["LV"] = "lv";
  Keymaps2["MK"] = "mk";
  Keymaps2["NL"] = "nl";
  Keymaps2["NO"] = "no";
  Keymaps2["PL"] = "pl";
  Keymaps2["PT"] = "pt";
  Keymaps2["PT_BR"] = "pt-br";
  Keymaps2["RU"] = "ru";
  Keymaps2["SL"] = "sl";
  Keymaps2["SV"] = "sv";
  Keymaps2["TH"] = "th";
  Keymaps2["TR"] = "tr";
  return Keymaps2;
})(Keymaps || {});
const keymapLabelMap = /* @__PURE__ */ new Map([
  ["ar", "keymaps.ar"],
  ["bepo", "keymaps.bepo"],
  ["cz", "keymaps.cz"],
  ["da", "keymaps.da"],
  ["de", "keymaps.de"],
  ["de-ch", "keymaps.de_ch"],
  ["en-gb", "keymaps.en_gb"],
  ["en-us", "keymaps.en_us"],
  ["en-us-altgr-intl", "keymaps.en_us_altgr_intl"],
  ["es", "keymaps.es"],
  ["et", "keymaps.et"],
  ["fi", "keymaps.fi"],
  ["fo", "keymaps.fo"],
  ["fr", "keymaps.fr"],
  ["fr-be", "keymaps.fr_be"],
  ["fr-ca", "keymaps.fr_ca"],
  ["fr-ch", "keymaps.fr_ch"],
  ["hr", "keymaps.hr"],
  ["hu", "keymaps.hu"],
  ["is", "keymaps.is"],
  ["it", "keymaps.it"],
  ["ja", "keymaps.ja"],
  ["lt", "keymaps.lt"],
  ["lv", "keymaps.lv"],
  ["mk", "keymaps.mk"],
  ["nl", "keymaps.nl"],
  ["no", "keymaps.no"],
  ["pl", "keymaps.pl"],
  ["pt", "keymaps.pt"],
  ["pt-br", "keymaps.pt_br"],
  ["ru", "keymaps.ru"],
  ["sl", "keymaps.sl"],
  ["sv", "keymaps.sv"],
  ["th", "keymaps.th"],
  ["tr", "keymaps.tr"]
]);
Object.entries(Keymaps).map(
  ([, value]) => new cr(value, keymapLabelMap.get(value))
);
const MouseButtonMap = /* @__PURE__ */ new Map([
  [0, "left"],
  [1, "middle"],
  [2, "right"],
  [3, "up"],
  [4, "down"]
]);
const cumulativeScrolling = !(browser.is_firefox && !browser.is_mac);
class MouseEventHandler {
  //   private kvmSore = useKvmStore();
  constructor(el, videoId, apiWs) {
    this.el = el;
    this.videoId = videoId;
    this.apiWs = apiWs;
    this.bindEvents();
    this.updateRate();
  }
  planned_pos = { x: 0, y: 0 };
  relative_touch_pos = null;
  sent_pos = { x: 0, y: 0 };
  scroll_delta = { x: 0, y: 0 };
  /** 鼠标是否hover在视频上面 */
  streamHovered = false;
  /** 鼠标是否hover在视频上面 */
  configState = {};
  //   private serverStorage: ServerStorageInfo;
  /** 鼠标滚轮速率 */
  relative_deltas = [];
  timer;
  // private get videoId() {
  //   return this.kvmSore.videoElId;
  // }
  get absolute() {
    return true;
  }
  /** 计算鼠标polling */
  get computedMousePolling() {
    return DEFAULT_MOUSE_POLLING;
  }
  /** 绑定事件 */
  bindEvents() {
    this.el.addEventListener("wheel", (e) => this.onMouseWheelScroll(e));
    this.el.addEventListener("mouseenter", (e) => this.onMouseLeaveOrEnter(e, true));
    this.el.addEventListener("mouseleave", (e) => this.onMouseLeaveOrEnter(e, false));
    this.el.addEventListener("contextmenu", (e) => e.preventDefault());
    this.el.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.el.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.el.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.el.addEventListener("touchmove", (e) => this.onTouchMove(e));
    this.el.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.el.addEventListener("touchend", () => this.onTouchEnd());
  }
  onTouchStart(event) {
    if (event.touches.length === 1) {
      if (this.absolute) {
        this.planned_pos = this.getTouchPosition(event.touches[0]);
        this.sendPlannedMove();
      } else {
        this.relative_touch_pos = this.getTouchPosition(event.touches[0]);
      }
    }
  }
  onTouchEnd() {
    this.sendPlannedMove();
  }
  /** 触摸移动事件（移动端兼容） */
  onTouchMove(event) {
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
          y: pos.y - this.relative_touch_pos.y
        });
        this.relative_touch_pos = pos;
      }
    }
  }
  getTouchPosition(touch) {
    if (touch.target?.getBoundingClientRect) {
      const rect = touch.target.getBoundingClientRect();
      return {
        x: Math.round(touch.clientX - rect.left),
        y: Math.round(touch.clientY - rect.top)
      };
    }
    return null;
  }
  /** 鼠标进入或离开事件 */
  onMouseLeaveOrEnter(event, enter) {
    this.streamHovered = enter;
  }
  /** 鼠标滚轮事件 */
  onMouseWheelScroll(event) {
    event.preventDefault();
    const delta = { x: 0, y: 0 };
    if (cumulativeScrolling) {
      const factor = browser.is_mac ? 5 : 1;
      this.scroll_delta.x += event.deltaX * factor;
      if (Math.abs(this.scroll_delta.x) >= 100) {
        delta.x = this.scroll_delta.x / Math.abs(this.scroll_delta.x) * -5;
        this.scroll_delta.x = 0;
      }
      this.scroll_delta.y += event.deltaY * factor;
      if (Math.abs(this.scroll_delta.y) >= 100) {
        delta.y = this.scroll_delta.y / Math.abs(this.scroll_delta.y) * -5;
        this.scroll_delta.y = 0;
      }
    } else {
      if (event.deltaX !== 0) {
        delta.x = event.deltaX / Math.abs(event.deltaX) * -5;
      }
      if (event.deltaY !== 0) {
        delta.y = event.deltaY / Math.abs(event.deltaY) * -5;
      }
    }
    this.sendScroll(delta);
  }
  get isPointerLocked() {
    return document.pointerLockElement === this.el;
  }
  /** 鼠标移动事件 */
  onMouseMove(event) {
    event.preventDefault();
    if (this.absolute) {
      const rect = event.target.getBoundingClientRect();
      this.planned_pos = {
        x: Math.max(Math.round(event.clientX - rect.left), 0),
        y: Math.max(Math.round(event.clientY - rect.top), 0)
      };
    } else if (this.isPointerLocked) {
      const { movementX: x2, movementY: y } = event;
      this.sendOrPlanRelativeMove({ x: x2, y });
    }
  }
  sendOrPlanRelativeMove(delta) {
    delta = {
      x: Math.min(Math.max(-127, Math.floor(delta.x * DEFAULT_RELATIVE_SENSE / 10)), 127),
      y: Math.min(Math.max(-127, Math.floor(delta.y * DEFAULT_RELATIVE_SENSE / 10)), 127)
    };
    if (this.configState.squashRelativeMoves) {
      this.relative_deltas.push(delta);
    } else {
      this.sendEvent({
        event_type: "mouse_relative",
        event: { delta }
      });
    }
  }
  sendPlannedMove() {
    if (this.absolute) {
      if (this.planned_pos.x !== this.sent_pos.x || this.planned_pos.y !== this.sent_pos.y) {
        const { x: x2, y } = this.planned_pos;
        const geo = getGeometry(this.videoId);
        const remapX = remap(x2, geo.x, geo.width, -32768, 32767);
        const remapY = remap(y, geo.y, geo.height, -32768, 32767);
        this.sendEvent({
          event_type: "mouse_move",
          event: { to: { x: remapX, y: remapY } }
        });
        this.sent_pos = this.planned_pos;
      }
    } else if (this.relative_deltas.length) {
      this.sendEvent({
        event_type: "mouse_relative",
        event: { delta: this.relative_deltas, squash: true }
      });
      this.relative_deltas = [];
    }
  }
  /** 鼠标按下事件 */
  onMouseDown(event) {
    event.preventDefault();
    if (
      // @ts-ignore
      this.absolute && event.target.id === this.videoId || // @ts-ignore
      event.target.id === "hdmi-lost"
    ) {
      const params = {
        event_type: "mouse_button",
        event: { button: MouseButtonMap.get(event.button), state: true }
      };
      this.sendEvent(params);
    } else if (this.isPointerLocked && event.target.id === "stream-box") {
      const params = {
        event_type: "mouse_button",
        event: { button: MouseButtonMap.get(event.button), state: true }
      };
      this.sendEvent(params);
    }
  }
  /** 鼠标抬起事件 */
  onMouseUp(event) {
    event.preventDefault();
    const params = {
      event_type: "mouse_button",
      event: { button: MouseButtonMap.get(event.button), state: false }
    };
    this.sendEvent(params);
  }
  /** 发送鼠标滚轮事件 */
  sendScroll(delta) {
    if (delta.x || delta.y) {
      this.sendEvent({
        event_type: "mouse_wheel",
        event: { delta }
      });
    }
  }
  /** 发送鼠标事件 */
  sendEvent(data) {
    sendHidEvent(this.apiWs, data);
  }
  async updateRate() {
    this.timer && clearTimeout(this.timer);
    await Er(this.computedMousePolling);
    this.sendPlannedMove();
    this.updateRate();
  }
}
var AllKeyboardKeys = /* @__PURE__ */ ((AllKeyboardKeys2) => {
  AllKeyboardKeys2["Escape"] = "Escape";
  AllKeyboardKeys2["F1"] = "F1";
  AllKeyboardKeys2["F2"] = "F2";
  AllKeyboardKeys2["F3"] = "F3";
  AllKeyboardKeys2["F4"] = "F4";
  AllKeyboardKeys2["F5"] = "F5";
  AllKeyboardKeys2["F6"] = "F6";
  AllKeyboardKeys2["F7"] = "F7";
  AllKeyboardKeys2["F8"] = "F8";
  AllKeyboardKeys2["F9"] = "F9";
  AllKeyboardKeys2["F10"] = "F10";
  AllKeyboardKeys2["F11"] = "F11";
  AllKeyboardKeys2["F12"] = "F12";
  AllKeyboardKeys2["Backquote"] = "Backquote";
  AllKeyboardKeys2["Digit1"] = "Digit1";
  AllKeyboardKeys2["Digit2"] = "Digit2";
  AllKeyboardKeys2["Digit3"] = "Digit3";
  AllKeyboardKeys2["Digit4"] = "Digit4";
  AllKeyboardKeys2["Digit5"] = "Digit5";
  AllKeyboardKeys2["Digit6"] = "Digit6";
  AllKeyboardKeys2["Digit7"] = "Digit7";
  AllKeyboardKeys2["Digit8"] = "Digit8";
  AllKeyboardKeys2["Digit9"] = "Digit9";
  AllKeyboardKeys2["Digit0"] = "Digit0";
  AllKeyboardKeys2["Minus"] = "Minus";
  AllKeyboardKeys2["Equal"] = "Equal";
  AllKeyboardKeys2["Backspace"] = "Backspace";
  AllKeyboardKeys2["Tab"] = "Tab";
  AllKeyboardKeys2["KeyQ"] = "KeyQ";
  AllKeyboardKeys2["KeyW"] = "KeyW";
  AllKeyboardKeys2["KeyE"] = "KeyE";
  AllKeyboardKeys2["KeyR"] = "KeyR";
  AllKeyboardKeys2["KeyT"] = "KeyT";
  AllKeyboardKeys2["KeyY"] = "KeyY";
  AllKeyboardKeys2["KeyU"] = "KeyU";
  AllKeyboardKeys2["KeyI"] = "KeyI";
  AllKeyboardKeys2["KeyO"] = "KeyO";
  AllKeyboardKeys2["KeyP"] = "KeyP";
  AllKeyboardKeys2["BracketLeft"] = "BracketLeft";
  AllKeyboardKeys2["BracketRight"] = "BracketRight";
  AllKeyboardKeys2["Backslash"] = "Backslash";
  AllKeyboardKeys2["CapsLock"] = "CapsLock";
  AllKeyboardKeys2["KeyA"] = "KeyA";
  AllKeyboardKeys2["KeyS"] = "KeyS";
  AllKeyboardKeys2["KeyD"] = "KeyD";
  AllKeyboardKeys2["KeyF"] = "KeyF";
  AllKeyboardKeys2["KeyG"] = "KeyG";
  AllKeyboardKeys2["KeyH"] = "KeyH";
  AllKeyboardKeys2["KeyJ"] = "KeyJ";
  AllKeyboardKeys2["KeyK"] = "KeyK";
  AllKeyboardKeys2["KeyL"] = "KeyL";
  AllKeyboardKeys2["Semicolon"] = "Semicolon";
  AllKeyboardKeys2["Quote"] = "Quote";
  AllKeyboardKeys2["Enter"] = "Enter";
  AllKeyboardKeys2["KeyZ"] = "KeyZ";
  AllKeyboardKeys2["KeyX"] = "KeyX";
  AllKeyboardKeys2["KeyC"] = "KeyC";
  AllKeyboardKeys2["KeyV"] = "KeyV";
  AllKeyboardKeys2["KeyB"] = "KeyB";
  AllKeyboardKeys2["KeyN"] = "KeyN";
  AllKeyboardKeys2["KeyM"] = "KeyM";
  AllKeyboardKeys2["Comma"] = "Comma";
  AllKeyboardKeys2["Period"] = "Period";
  AllKeyboardKeys2["Slash"] = "Slash";
  AllKeyboardKeys2["Space"] = "Space";
  AllKeyboardKeys2["ContextMenu"] = "ContextMenu";
  AllKeyboardKeys2["ScrollLock"] = "ScrollLock";
  AllKeyboardKeys2["Pause"] = "Pause";
  AllKeyboardKeys2["Insert"] = "Insert";
  AllKeyboardKeys2["Home"] = "Home";
  AllKeyboardKeys2["PageUp"] = "PageUp";
  AllKeyboardKeys2["Delete"] = "Delete";
  AllKeyboardKeys2["End"] = "End";
  AllKeyboardKeys2["PageDown"] = "PageDown";
  AllKeyboardKeys2["ArrowUp"] = "ArrowUp";
  AllKeyboardKeys2["ArrowLeft"] = "ArrowLeft";
  AllKeyboardKeys2["ArrowDown"] = "ArrowDown";
  AllKeyboardKeys2["ArrowRight"] = "ArrowRight";
  AllKeyboardKeys2["Power"] = "Power";
  AllKeyboardKeys2["NumLock"] = "NumLock";
  AllKeyboardKeys2["NumpadDivide"] = "NumpadDivide";
  AllKeyboardKeys2["NumpadMultiply"] = "NumpadMultiply";
  AllKeyboardKeys2["NumpadSubtract"] = "NumpadSubtract";
  AllKeyboardKeys2["Numpad7"] = "Numpad7";
  AllKeyboardKeys2["Numpad8"] = "Numpad8";
  AllKeyboardKeys2["Numpad9"] = "Numpad9";
  AllKeyboardKeys2["Numpad4"] = "Numpad4";
  AllKeyboardKeys2["Numpad5"] = "Numpad5";
  AllKeyboardKeys2["Numpad6"] = "Numpad6";
  AllKeyboardKeys2["NumpadAdd"] = "NumpadAdd";
  AllKeyboardKeys2["Numpad1"] = "Numpad1";
  AllKeyboardKeys2["Numpad2"] = "Numpad2";
  AllKeyboardKeys2["Numpad3"] = "Numpad3";
  AllKeyboardKeys2["Numpad0"] = "Numpad0";
  AllKeyboardKeys2["NumpadDecimal"] = "NumpadDecimal";
  AllKeyboardKeys2["NumpadEnter"] = "NumpadEnter";
  AllKeyboardKeys2["ShiftLeft"] = "ShiftLeft";
  AllKeyboardKeys2["ShiftRight"] = "ShiftRight";
  AllKeyboardKeys2["ControlLeft"] = "ControlLeft";
  AllKeyboardKeys2["MetaLeft"] = "MetaLeft";
  AllKeyboardKeys2["MetaRight"] = "MetaRight";
  AllKeyboardKeys2["AltLeft"] = "AltLeft";
  AllKeyboardKeys2["AltRight"] = "AltRight";
  AllKeyboardKeys2["Win"] = "Win";
  AllKeyboardKeys2["ControlRight"] = "ControlRight";
  AllKeyboardKeys2["PrintScreen"] = "PrintScreen";
  return AllKeyboardKeys2;
})(AllKeyboardKeys || {});
class KeyboardKey {
  constructor(code, title, subtitle, width = 32, lockStatus, withLock, withDot, ledPosition = "center", titlePosition = "center", subtitlePosition, isGutter = false, shrink = 1) {
    this.code = code;
    this.title = title;
    this.subtitle = subtitle;
    this.width = width;
    this.lockStatus = lockStatus;
    this.withLock = withLock;
    this.withDot = withDot;
    this.ledPosition = ledPosition;
    this.titlePosition = titlePosition;
    this.subtitlePosition = subtitlePosition;
    this.isGutter = isGutter;
    this.shrink = shrink;
  }
}
class KeyboardKeyWithCustomShrink extends KeyboardKey {
  constructor(code, title, subtitle, shrink = 1, titlePosition = "left", lockStatus, withLock, withDot, ledPosition = "left", subtitlePosition, isGutter = false) {
    super(
      code,
      title,
      subtitle,
      void 0,
      lockStatus,
      withLock,
      withDot,
      ledPosition,
      titlePosition,
      subtitlePosition,
      isGutter
    );
    this.code = code;
    this.title = title;
    this.subtitle = subtitle;
    this.shrink = shrink;
    this.titlePosition = titlePosition;
    this.lockStatus = lockStatus;
    this.withLock = withLock;
    this.withDot = withDot;
    this.ledPosition = ledPosition;
    this.subtitlePosition = subtitlePosition;
    this.isGutter = isGutter;
  }
}
class KeyboardKeyWithShortCut extends KeyboardKey {
  constructor(code, title, shortcutTitle, subtitle, width = 32, lockStatus, withLock, withDot, ledPosition = "left", titlePosition = "left", subtitlePosition, isGutter = false, shrink = 1) {
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
    );
    this.code = code;
    this.title = title;
    this.shortcutTitle = shortcutTitle;
    this.subtitle = subtitle;
    this.width = width;
    this.lockStatus = lockStatus;
    this.withLock = withLock;
    this.withDot = withDot;
    this.ledPosition = ledPosition;
    this.titlePosition = titlePosition;
    this.subtitlePosition = subtitlePosition;
    this.isGutter = isGutter;
    this.shrink = shrink;
  }
}
const KeyGutter = { isGutter: true, width: 32, shrink: 1 };
const TinyKeyGutter = { isGutter: true, width: 24, shrink: 0.5 };
const genKeyboardKeyList = (config) => {
  return {
    left: [
      [
        new KeyboardKey(
          "Escape",
          "Esc",
          void 0,
          void 0,
          void 0,
          void 0,
          void 0,
          void 0,
          "left"
        ),
        TinyKeyGutter,
        new KeyboardKey("F1", "F1"),
        new KeyboardKey("F2", "F2"),
        new KeyboardKey("F3", "F3"),
        new KeyboardKey("F4", "F4"),
        TinyKeyGutter,
        new KeyboardKey("F5", "F5"),
        new KeyboardKey("F6", "F6"),
        new KeyboardKey("F7", "F7"),
        new KeyboardKey("F8", "F8"),
        TinyKeyGutter,
        new KeyboardKey("F9", "F9"),
        new KeyboardKey("F10", "F10"),
        new KeyboardKey("F11", "F11"),
        new KeyboardKey("F12", "F12")
      ],
      [
        new KeyboardKey("Backquote", "~", "`"),
        new KeyboardKey("Digit1", "!", "1"),
        new KeyboardKey("Digit2", "@", "2"),
        new KeyboardKey("Digit3", "#", "3"),
        new KeyboardKey("Digit4", "$", "4"),
        new KeyboardKey("Digit5", "%", "5"),
        new KeyboardKey("Digit6", "^", "6"),
        new KeyboardKey("Digit7", "&", "7"),
        new KeyboardKey("Digit8", "*", "8"),
        new KeyboardKey("Digit9", "(", "9"),
        new KeyboardKey("Digit0", ")", "0"),
        new KeyboardKey("Minus", "_", "-"),
        new KeyboardKey("Equal", "+", "="),
        new KeyboardKeyWithCustomShrink(
          "Backspace",
          "Backspace",
          void 0,
          1.5,
          "right"
        )
      ],
      [
        new KeyboardKeyWithCustomShrink("Tab", "Tab", "", 1.5),
        new KeyboardKey("KeyQ", "Q"),
        new KeyboardKey("KeyW", "W"),
        new KeyboardKey("KeyE", "E"),
        new KeyboardKey("KeyR", "R"),
        new KeyboardKey("KeyT", "T"),
        new KeyboardKey("KeyY", "Y"),
        new KeyboardKey("KeyU", "U"),
        new KeyboardKey("KeyI", "I"),
        new KeyboardKey("KeyO", "O"),
        new KeyboardKey("KeyP", "P"),
        new KeyboardKey("BracketLeft", "{", "["),
        new KeyboardKey("BracketRight", "}", "]"),
        new KeyboardKey("Backslash", "|", "\\")
      ],
      [
        new KeyboardKeyWithCustomShrink(
          "CapsLock",
          "Caps",
          void 0,
          1.75,
          "left",
          config?.caps,
          true,
          void 0,
          "right"
        ),
        new KeyboardKey("KeyA", "A"),
        new KeyboardKey("KeyS", "S"),
        new KeyboardKey("KeyD", "D"),
        new KeyboardKey("KeyF", "F"),
        new KeyboardKey("KeyG", "G"),
        new KeyboardKey("KeyH", "H"),
        new KeyboardKey("KeyJ", "J"),
        new KeyboardKey("KeyK", "K"),
        new KeyboardKey("KeyL", "L"),
        new KeyboardKey("Semicolon", ":", ";"),
        new KeyboardKey("Quote", '"', "'"),
        new KeyboardKeyWithCustomShrink("Enter", "Enter", void 0, 1.75, "right")
      ],
      [
        new KeyboardKeyWithCustomShrink("ShiftLeft", "Shift", void 0, 2),
        new KeyboardKey("KeyZ", "Z"),
        new KeyboardKey("KeyX", "X"),
        new KeyboardKey("KeyC", "C"),
        new KeyboardKey("KeyV", "V"),
        new KeyboardKey("KeyB", "B"),
        new KeyboardKey("KeyN", "N"),
        new KeyboardKey("KeyM", "M"),
        new KeyboardKey("Comma", ",", "<"),
        new KeyboardKey("Period", ".", ">"),
        new KeyboardKey("Slash", "/", "?"),
        new KeyboardKeyWithCustomShrink("ShiftRight", "Shift", void 0, 2, "right")
      ],
      [
        new KeyboardKeyWithCustomShrink("ControlLeft", "Ctrl", void 0, 1.5),
        new KeyboardKeyWithCustomShrink("MetaLeft", "Win", void 0, 1.5),
        new KeyboardKeyWithCustomShrink("AltLeft", "Alt", void 0, 1.5),
        new KeyboardKeyWithCustomShrink("Space", "Space", void 0, 4.4, "center"),
        new KeyboardKeyWithCustomShrink("AltRight", "Alt", void 0, 1.5, "right"),
        new KeyboardKeyWithCustomShrink("Win", "Win", void 0, 1.5, "right"),
        new KeyboardKeyWithCustomShrink(
          "ContextMenu",
          "Menu",
          void 0,
          1.5,
          "right"
        ),
        new KeyboardKeyWithCustomShrink(
          "ControlRight",
          "Ctrl",
          void 0,
          1.5,
          "right"
        )
      ]
    ],
    right: [
      [
        new KeyboardKey("PrintScreen", "Pt/Sq"),
        new KeyboardKey(
          "ScrollLock",
          "ScrLk",
          void 0,
          void 0,
          config?.scroll,
          true
        ),
        new KeyboardKey("Pause", "Pause")
      ],
      [
        new KeyboardKey("Insert", "Ins"),
        new KeyboardKey("Home", "Home"),
        new KeyboardKey("PageUp", "PgUp")
      ],
      [
        new KeyboardKey("Delete", "Del"),
        new KeyboardKey("End", "End"),
        new KeyboardKey("PageDown", "PgDn")
      ],
      [KeyGutter, KeyGutter, KeyGutter],
      [KeyGutter, new KeyboardKey("ArrowUp", "↑"), KeyGutter],
      [
        new KeyboardKey("ArrowLeft", "←"),
        new KeyboardKey("ArrowDown", "↓"),
        new KeyboardKey("ArrowRight", "→")
      ]
    ],
    bottom: [
      [
        new KeyboardKeyWithShortCut("PrintScreen", "Pt/Sq", ["Pt/", "Sq"]),
        new KeyboardKeyWithShortCut(
          "ScrollLock",
          "ScrLk",
          ["Scr", "Lk"],
          void 0,
          void 0,
          config?.scroll,
          true
        ),
        new KeyboardKeyWithShortCut("Pause", "Pause", ["Pau", "se"]),
        new KeyboardKeyWithShortCut("Insert", "Ins"),
        new KeyboardKeyWithShortCut("Home", "Home", ["Ho", "me"]),
        new KeyboardKeyWithShortCut("PageUp", "PgUp", ["Pg", "Up"]),
        new KeyboardKeyWithShortCut("PageDown", "PgDn", ["Pg", "Dn"]),
        new KeyboardKey("Delete", "Del"),
        new KeyboardKey("End", "End")
      ]
    ],
    bottomRight: [
      [KeyGutter, new KeyboardKey("ArrowUp", "↑"), KeyGutter],
      [
        new KeyboardKey("ArrowLeft", "←"),
        new KeyboardKey("ArrowDown", "↓"),
        new KeyboardKey("ArrowRight", "→")
      ]
    ]
  };
};
const { ControlLeft, AltLeft, MetaLeft, KeyP, ShiftLeft, F4, Tab, Delete, KeyW } = AllKeyboardKeys;
const KeyboardShortcutConfigMap = /* @__PURE__ */ new Map([
  [0, { keys: [ControlLeft, AltLeft, Delete], label: "Ctrl + Alt + Del" }],
  [5, { keys: [MetaLeft, KeyP], label: "Win + P" }],
  [1, { keys: [AltLeft, ShiftLeft], label: "Alt + Shift" }],
  [4, { keys: [ControlLeft, KeyW], label: "Ctrl + W" }],
  [2, { keys: [AltLeft, Tab], label: "Alt + Tab" }],
  [3, { keys: [AltLeft, F4], label: "Alt + F4" }]
  /** 特殊处理more */
  // [KeyShortcuts.MORE, {keys: [], label: 'common.more'}],
]);
const shortcutKeyOptions = [
  0,
  1,
  2,
  3,
  5,
  4
  /* CTROL_W */
  // KeyShortcuts.MORE,
].map((item) => new cr(item, KeyboardShortcutConfigMap.get(item).label));
shortcutKeyOptions.map(
  (item) => KeyboardShortcutConfigMap.get(item.value)
);
const KeyboardLabelMap = /* @__PURE__ */ new Map([
  ["ControlLeft", "Ctrl-L"],
  ["AltLeft", "Alt-L"],
  ["MetaLeft", "Windows"],
  ["ShiftLeft", "Shift-L"],
  ["AltRight", "Alt-R"],
  ["ControlRight", "Ctrl-R"],
  ["ShiftRight", "Shift-R"],
  ["CapsLock", "Caps Lock"],
  ["NumpadMultiply", "*"],
  ["Backspace", "Backspace"]
]);
Object.values(genKeyboardKeyList()).flat().flat().forEach((item) => {
  if (item.isGutter) {
    return;
  }
  if (!KeyboardLabelMap.has(item.code)) {
    KeyboardLabelMap.set(item.code, item.title);
  }
});
class KeyboardEventHandler {
  constructor(el, apiWS) {
    this.el = el;
    this.apiWS = apiWS;
    console.log("init keyboard", this.el);
    this.init();
  }
  /** 全局的变量，用来存储键盘按下的键 */
  keydownKeys = /* @__PURE__ */ new Set();
  /** 虚拟键盘这儿存储的按下的控制键（之所以这里用ref，是因为界面上需要根据这个值的变化作展示：按下的时候虚拟按键背景色变化） */
  virtualKeyboardPressedControlKeys = ref(/* @__PURE__ */ new Set());
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
  ];
  /**
   * @description 判断是否是操控按键
   */
  static isControlKey(key) {
    return KeyboardEventHandler.ControlKeys.includes(key);
  }
  // private configState: KvmConfigState
  get keyboardControl() {
    return true;
  }
  keyboardEnabled = true;
  setKeyboardEnabled(enabled) {
    this.keyboardEnabled = enabled;
  }
  init() {
    this.el.addEventListener("keydown", (event) => {
      console.log("keydown event:", event);
      event.preventDefault();
      this.onKeyDownOrUp(event.code || event.key, true, this.keyboardControl);
    });
    this.el.addEventListener("keyup", (event) => {
      event.preventDefault();
      this.onKeyDownOrUp(event.code || event.key, false, this.keyboardControl);
    });
  }
  onKeyDownOrUp(key, down, enable = true, isVirtualKeyboard = false) {
    console.log("key: ", { key, down, enable, isVirtualKeyboard });
    if (!enable) return;
    {
      this.sendHidEvent({ key, state: down }, enable);
      this.clearAllPressControlDownKeys();
      if (down) {
        this.keydownKeys.add(key);
      } else {
        if (browser.is_mac && [AllKeyboardKeys.MetaLeft, AllKeyboardKeys.MetaRight].includes(key)) {
          this.clearAllPressDownKeys();
        }
        this.keydownKeys.delete(key);
      }
    }
  }
  clearAllPressDownKeys() {
    for (const key of this.keydownKeys) {
      this.sendEvent({ key, state: false });
    }
    this.clearAllPressControlDownKeys();
  }
  clearAllPressControlDownKeys() {
    for (const key of this.virtualKeyboardPressedControlKeys.value) {
      if (KeyboardEventHandler.isControlKey(key)) {
        this.virtualKeyboardPressedControlKeys.value.delete(key);
        this.sendEvent({ key, state: false });
      }
    }
  }
  isControlKeyDown(key) {
    if (!KeyboardEventHandler.isControlKey(key)) {
      return false;
    }
    return this.virtualKeyboardPressedControlKeys.value.has(key);
  }
  sendShortcutKey(keys) {
    const states = [true, false];
    states.forEach((state) => {
      for (let i = 0; i <= 1; i++) {
        keys.forEach((key) => {
          this.sendEvent({ key, state }, true);
        });
        i++;
      }
    });
  }
  sendHidEvent(event, enable = true) {
    if (enable) {
      this.sendEvent(event);
    }
  }
  static downedKeys = /* @__PURE__ */ new Set();
  sendEvent(event, forceSend) {
    if (!this.keyboardEnabled && !forceSend) {
      return;
    }
    if (event.state) {
      if (!KeyboardEventHandler.downedKeys.has(event.key)) {
        KeyboardEventHandler.downedKeys.add(event.key);
      } else {
        return;
      }
    } else {
      if (KeyboardEventHandler.downedKeys.has(event.key)) {
        KeyboardEventHandler.downedKeys.delete(event.key);
      }
    }
    sendHidEvent(this.apiWS, { event_type: "key", event });
  }
}
const deviceModelSelectOptions = [
  new cr("RM1", "RM1"),
  new cr("RM1PE", "RM1PE"),
  new cr("RM10", "RM10")
];
var WsEventType = /* @__PURE__ */ ((WsEventType2) => {
  WsEventType2["PONG"] = "pong";
  WsEventType2["HID_KEYMAPS_STATE"] = "hid_keymaps";
  WsEventType2["HID_STATE"] = "hid";
  WsEventType2["ATX_STATE"] = "atx";
  WsEventType2["MSD_STATE"] = "msd";
  WsEventType2["STREAMER_STATE"] = "streamer";
  WsEventType2["FINGERBOT_STATE"] = "fingerbot";
  WsEventType2["TURN_STATE"] = "turn";
  return WsEventType2;
})(WsEventType || {});
class KvmStreamConnector {
  constructor(kvm, videoElSelector, videoBoxElSelector) {
    this.kvm = kvm;
    this.videoElSelector = videoElSelector;
    this.videoBoxElSelector = videoBoxElSelector;
    this.videoEl = $(this.videoElSelector);
    this.videoBox = $(this.videoBoxElSelector);
    this.initApiWsSocket();
  }
  videoEl;
  videoBox;
  mouseHandler;
  keyboardHandler;
  initApiWsSocket() {
    useWsMessage(this.kvm, (ws) => this.initMouseEvent(ws));
  }
  initMouseEvent(ws) {
    this.mouseHandler = new MouseEventHandler(this.videoBox, this.videoElSelector, ws);
    this.keyboardHandler = new KeyboardEventHandler(this.videoBox, ws);
  }
}
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "addKvmModal",
  props: {
    open: { type: Boolean }
  },
  emits: ["update:open", "success"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const formRef = ref();
    const open = computed({
      get: () => props.open,
      set: (val) => {
        emits("update:open", val);
      }
    });
    const formState = ref({});
    const formRules = {
      name: [{ required: true, message: "Please enter the KVM name" }],
      password: [{ required: true, message: "Please enter the KVM password" }],
      ip: [
        {
          required: true,
          async validator(_, value) {
            if (!an(value)) {
              throw "Please enter the correct KVM IP";
            }
          }
        }
      ],
      deviceModel: [{ required: true, message: "Please select the KVM model" }]
    };
    const handleClose = () => {
      open.value = false;
      formState.value = {};
    };
    const handleBeforeOk = async (done) => {
      try {
        await formRef.value.validateFields();
        await mainService.addKvmDevice(formState.value);
        emits("success");
        done(true);
      } catch (error) {
        log(error);
        done(false);
        new ErrorMsgHandler(error);
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createBlock(unref(bo), {
        open: open.value,
        "onUpdate:open": _cache[4] || (_cache[4] = ($event) => open.value = $event),
        width: 420,
        title: "Add KVM Device",
        "content-style": { paddingBlockEnd: "0px" },
        "before-ok": handleBeforeOk,
        onClose: handleClose
      }, {
        default: withCtx(() => [
          open.value ? (openBlock(), createBlock(unref(go), {
            key: 0,
            ref_key: "formRef",
            ref: formRef,
            model: formState.value,
            rules: formRules,
            layout: "vertical",
            "label-align": "left",
            "hide-required-mark": "",
            colon: false,
            "validate-trigger": ["change", "blur"]
          }, {
            default: withCtx(() => [
              createVNode(unref(FormItem), {
                label: "KVM Device Name",
                name: "name"
              }, {
                default: withCtx(() => [
                  createVNode(unref(fo), {
                    value: formState.value.name,
                    "onUpdate:value": _cache[0] || (_cache[0] = ($event) => formState.value.name = $event),
                    placeholder: "Enter KVM Name",
                    size: "small",
                    name: "name"
                  }, null, 8, ["value"])
                ]),
                _: 1
              }),
              createVNode(unref(FormItem), {
                label: "KVM Device IP",
                name: "ip"
              }, {
                default: withCtx(() => [
                  createVNode(unref(fo), {
                    value: formState.value.ip,
                    "onUpdate:value": _cache[1] || (_cache[1] = ($event) => formState.value.ip = $event),
                    placeholder: "Enter KVM Ip Address",
                    size: "small",
                    name: "ip"
                  }, null, 8, ["value"])
                ]),
                _: 1
              }),
              createVNode(unref(FormItem), {
                label: "KVM Device Password",
                name: "password"
              }, {
                default: withCtx(() => [
                  createVNode(unref(fo), {
                    value: formState.value.password,
                    "onUpdate:value": _cache[2] || (_cache[2] = ($event) => formState.value.password = $event),
                    placeholder: "Enter KVM Password",
                    size: "small",
                    name: "password"
                  }, null, 8, ["value"])
                ]),
                _: 1
              }),
              createVNode(unref(FormItem), {
                label: "KVM Device Model",
                name: "deviceModel"
              }, {
                default: withCtx(() => [
                  createVNode(unref(vo), {
                    value: formState.value.deviceModel,
                    "onUpdate:value": _cache[3] || (_cache[3] = ($event) => formState.value.deviceModel = $event),
                    options: unref(deviceModelSelectOptions),
                    placeholder: "Enter KVM Device Model ",
                    size: "small",
                    name: "deviceModel"
                  }, null, 8, ["value", "options"])
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["model"])) : createCommentVNode("", true)
        ]),
        _: 1
      }, 8, ["open"]);
    };
  }
});
const _hoisted_1$5 = { class: "inner flex-btw" };
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "kvmListItem",
  props: {
    kvm: {}
  },
  emits: ["delete"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const removeKvm = () => {
      emit("delete");
    };
    const hovered = ref(false);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: "list-item pointer bg-primary",
        onMouseenter: _cache[0] || (_cache[0] = ($event) => hovered.value = true),
        onMouseleave: _cache[1] || (_cache[1] = ($event) => hovered.value = false)
      }, [
        createBaseVNode("div", _hoisted_1$5, [
          createVNode(unref(At), null, {
            default: withCtx(() => [
              createTextVNode(toDisplayString(_ctx.kvm.name), 1)
            ]),
            _: 1
          }),
          hovered.value ? (openBlock(), createBlock(unref(Oo), {
            key: 0,
            icon: "delete",
            onClick: withModifiers(removeKvm, ["stop"])
          }, {
            default: withCtx(() => [
              createVNode(unref(x), { name: "gl-kvm-delete" })
            ]),
            _: 1
          })) : (openBlock(), createBlock(unref(Mo), { key: 1 }, {
            default: withCtx(() => [
              createTextVNode(toDisplayString(_ctx.kvm.deviceModel), 1)
            ]),
            _: 1
          }))
        ])
      ], 32);
    };
  }
});
const KvmListItem = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-01f71db4"]]);
const _hoisted_1$4 = { class: "kvm-list" };
const _hoisted_2$2 = { class: "flex title" };
const _hoisted_3$2 = { key: 0 };
const _hoisted_4$2 = {
  key: 1,
  class: "list-container"
};
const _hoisted_5$1 = { class: "flex" };
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "layoutKvmList",
  emits: ["addToPage", "remove"],
  setup(__props, { emit: __emit }) {
    const state = reactive({
      addOpen: false,
      kvmList: []
    });
    const emits = __emit;
    const getKvmDeviceList = async () => {
      try {
        const res = await mainService.getKvmDeviceList();
        console.log(res);
        state.kvmList = res.info;
      } catch (error) {
        new ErrorMsgHandler(error, "Get Kvm Device List Failed");
      }
    };
    getKvmDeviceList();
    const removeKvm = async (device) => {
      D({
        content: `Are sure to remove this device ${device.name}?`,
        async onOk() {
          await mainService.deleteKvmDevice(device.id);
          getKvmDeviceList();
          emits("remove", device.id);
        }
      });
    };
    const handleConnect = async (kvm) => {
      try {
        await mainService.connectKvm(kvm.id);
        emits("addToPage", kvm);
      } catch (error) {
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(Fragment, null, [
        createBaseVNode("div", _hoisted_1$4, [
          createBaseVNode("div", _hoisted_2$2, [
            createVNode(unref(At), {
              variant: "level2",
              type: "body-m",
              class: "text-primary"
            }, {
              default: withCtx(() => _cache[2] || (_cache[2] = [
                createTextVNode("KVM Devices", -1)
              ])),
              _: 1,
              __: [2]
            })
          ]),
          createVNode(unref($o), { horizontal: "" }),
          !state.kvmList?.length ? (openBlock(), createElementBlock("div", _hoisted_3$2, [
            createVNode(unref(ko))
          ])) : (openBlock(), createElementBlock("div", _hoisted_4$2, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(state.kvmList, (kvm) => {
              return openBlock(), createBlock(KvmListItem, {
                key: kvm.id,
                kvm,
                onDelete: ($event) => removeKvm(kvm),
                onClick: ($event) => handleConnect(kvm)
              }, null, 8, ["kvm", "onDelete", "onClick"]);
            }), 128))
          ])),
          createBaseVNode("div", _hoisted_5$1, [
            createVNode(unref(Q), {
              primary: "",
              onClick: _cache[0] || (_cache[0] = ($event) => state.addOpen = true)
            }, {
              default: withCtx(() => _cache[3] || (_cache[3] = [
                createTextVNode("Click to Add KVM", -1)
              ])),
              _: 1,
              __: [3]
            })
          ]),
          _cache[4] || (_cache[4] = createBaseVNode("div", { class: "flex" }, null, -1))
        ]),
        createVNode(_sfc_main$6, {
          open: state.addOpen,
          "onUpdate:open": _cache[1] || (_cache[1] = ($event) => state.addOpen = $event),
          onSuccess: getKvmDeviceList
        }, null, 8, ["open"])
      ], 64);
    };
  }
});
const LayoutKvmList = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-b6e416e8"]]);
const _hoisted_1$3 = {
  key: 0,
  class: "stream-window-wrapper position-absolute bg-default"
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "kvmDevicePlayer",
  props: {
    kvm: {}
  },
  setup(__props) {
    const streamWindowRef = ref();
    const streamBoxRef = ref();
    const streamVideoRef = ref();
    const props = __props;
    const STREAM_BOX_ID = "stream-box" + props.kvm.id;
    const videoElId = `kvm-video-${props.kvm.id}`;
    const state = reactive({
      info: [],
      videoJanus: {},
      audioJanus: {},
      mouseHandler: null,
      // keyboardHandler: null as KeyboardEventHandler,
      wideScreen: false,
      /** 初始化视频流 Janus 完成 */
      initVideoJanusFinished: false,
      showLocalStream: false
    });
    const handleMouseEnter = () => {
    };
    const handleMouseLeave = () => {
    };
    const handleStreamBoxBlur = () => {
    };
    const handleStreamBoxFocus = () => {
      streamBoxRef.value?.focus();
    };
    const setActive = (isMediaAndFirst = false) => {
      if (browser.is_safari) {
        state.initVideoJanusFinished = true;
      }
    };
    const setInactive = () => {
    };
    const setInfo = (...args) => {
      const fps = args[3]?.fps;
      if (fps) {
        state.initVideoJanusFinished = true;
      }
    };
    const initJanus = async () => {
      state.videoJanus?.stopStream?.();
      state.showLocalStream = false;
      state.initVideoJanusFinished = false;
      const janus = new JanusStreamer(
        props.kvm,
        streamVideoRef.value,
        { setActive, setInactive, setInfo, rtcConfig: void 0 },
        false,
        true,
        async () => {
          state.initVideoJanusFinished = true;
        },
        () => {
          state.showLocalStream = true;
        }
      );
      state.videoJanus = janus;
    };
    const init = () => {
      new KvmStreamConnector(props.kvm, videoElId, STREAM_BOX_ID);
      initJanus();
    };
    onMounted(async () => {
      init();
    });
    const closeStream = () => {
      state.videoJanus?.stopStream?.();
    };
    onBeforeUnmount(() => {
      closeStream();
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        id: "stream-window",
        ref_key: "streamWindowRef",
        ref: streamWindowRef,
        class: normalizeClass({
          "bg-default": true,
          bordered: true,
          "stream-window-inited": state.initVideoJanusFinished
        })
      }, [
        createBaseVNode("div", {
          id: STREAM_BOX_ID,
          ref_key: "streamBoxRef",
          ref: streamBoxRef,
          tabindex: "-1",
          onBlur: handleStreamBoxBlur,
          onFocus: handleStreamBoxFocus,
          onClick: handleStreamBoxFocus,
          onMouseenter: handleMouseEnter,
          onMouseleave: handleMouseLeave
        }, [
          createBaseVNode("video", {
            id: videoElId,
            ref_key: "streamVideoRef",
            ref: streamVideoRef,
            class: "full-width kvm-video",
            playsinline: "",
            autoplay: "",
            muted: ""
          }, null, 512)
        ], 544),
        !state.initVideoJanusFinished ? (openBlock(), createElementBlock("div", _hoisted_1$3)) : createCommentVNode("", true)
      ], 2);
    };
  }
});
const KvmDevicePlayer = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-70220d41"]]);
const _hoisted_1$2 = { key: 0 };
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "baseRow",
  props: {
    countPerLine: {},
    items: { default: () => [] },
    gutter: { default: 16 }
  },
  setup(__props) {
    const EMPTY_ITEM = Symbol("empty_item");
    const props = __props;
    const computedItems = computed(() => {
      try {
        const items = props.items.reduce((acc, item, index) => {
          const rowIndex = Math.floor(index / props.countPerLine);
          if (!acc[rowIndex]) {
            acc[rowIndex] = [];
          }
          acc[rowIndex].push(item);
          return acc;
        }, []);
        const lastOuterChildNeeds = props.countPerLine - items[items.length - 1].length;
        if (lastOuterChildNeeds > 0) {
          items[items.length - 1].push(...Array(lastOuterChildNeeds).fill(EMPTY_ITEM));
        }
        return items;
      } catch (error) {
        return [];
      }
    });
    const computedStyle = computed(() => {
      let gutterX, gutterY;
      if (props.gutter instanceof Array) {
        [gutterX, gutterY] = props.gutter;
      } else {
        [gutterX, gutterY] = [props.gutter, props.gutter];
      }
      return { outer: { gap: gutterY + "px" }, inner: { gap: gutterX + "px" } };
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: "base-row display flex-start flex-nowrap flex-column flex-1",
        style: normalizeStyle(computedStyle.value.outer)
      }, [
        (openBlock(true), createElementBlock(Fragment, null, renderList(computedItems.value, (outer, index) => {
          return openBlock(), createElementBlock("div", {
            key: index,
            class: "row-line full-width",
            style: normalizeStyle(computedStyle.value.inner)
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(outer, (inner, indexInner) => {
              return openBlock(), createElementBlock("div", {
                key: indexInner,
                class: "base-col"
              }, [
                inner === unref(EMPTY_ITEM) ? (openBlock(), createElementBlock("div", _hoisted_1$2)) : renderSlot(_ctx.$slots, "default", {
                  key: 1,
                  data: inner
                }, void 0, true)
              ]);
            }), 128))
          ], 4);
        }), 128))
      ], 4);
    };
  }
});
const BaseRow = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-dc01da78"]]);
const _hoisted_1$1 = { class: "flex-btw" };
const _hoisted_2$1 = { class: "flex" };
const _hoisted_3$1 = {
  class: "flex",
  style: { "margin-top": "16px" }
};
const _hoisted_4$1 = {
  key: 1,
  class: "content"
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "layoutKvmContent",
  props: {
    kvmList: {}
  },
  setup(__props) {
    const { width } = Ae();
    const contentRef = ref();
    const props = __props;
    const state = reactive({
      dragMode: false
    });
    const countPerline = computed(() => {
      if (width.value >= 1364) {
        return 2;
      }
      return 1;
    });
    const requestFullscreen = () => {
      contentRef.value.requestFullscreen();
    };
    const handleDrag = () => {
      state.dragMode = true;
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        ref_key: "contentRef",
        ref: contentRef,
        class: "kvm-content full-height"
      }, [
        createBaseVNode("div", _hoisted_1$1, [
          createVNode(unref(At), {
            type: "large-title-m",
            center: "",
            class: "text-primary"
          }, {
            default: withCtx(() => _cache[0] || (_cache[0] = [
              createTextVNode("Welcome to KVM Monitor", -1)
            ])),
            _: 1,
            __: [0]
          }),
          createBaseVNode("div", _hoisted_2$1, [
            createVNode(unref(Oo), {
              style: { "margin-left": "12px" },
              icon: "",
              onClick: requestFullscreen
            }, {
              default: withCtx(() => [
                createVNode(unref(x), { name: "gl-kvm-fullscreen" })
              ]),
              _: 1
            }),
            createVNode(unref(Oo), {
              style: { "margin-left": "12px" },
              icon: "",
              onClick: handleDrag
            }, {
              default: withCtx(() => [
                createVNode(unref(x), { name: "gl-kvm-drag" })
              ]),
              _: 1
            })
          ])
        ]),
        createBaseVNode("div", _hoisted_3$1, [
          !props.kvmList?.length ? (openBlock(), createBlock(unref(ko), { key: 0 })) : (openBlock(), createElementBlock("div", _hoisted_4$1, [
            createVNode(BaseRow, {
              gutter: 0,
              "count-per-line": countPerline.value,
              items: props.kvmList
            }, {
              default: withCtx(({ data }) => [
                createVNode(KvmDevicePlayer, { kvm: data }, null, 8, ["kvm"])
              ]),
              _: 1
            }, 8, ["count-per-line", "items"])
          ]))
        ])
      ], 512);
    };
  }
});
const LayoutKvmContent = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-315a5f09"]]);
const _hoisted_1 = { class: "main-layout full-height" };
const _hoisted_2 = { class: "header bg-primary flex-btw" };
const _hoisted_3 = { class: "flex" };
const _hoisted_4 = { class: "content flex-start flex-nowrap" };
const _hoisted_5 = { class: "content-left" };
const _hoisted_6 = { class: "content-right flex-1" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "mainLayout",
  setup(__props) {
    const router = useRouter();
    const state = reactive({
      kvmList: []
    });
    const removeKvm = async (id) => {
      state.kvmList = state.kvmList.filter((item) => item.id !== id);
    };
    const handleConnectDevice = (device) => {
      if (state.kvmList.find((item) => item.id === device.id)) {
        return;
      }
      state.kvmList.push(device);
    };
    const logout = () => {
      D({
        title: "Logout",
        content: "Are you sure you want to logout?",
        onOk() {
          removeLogin();
          router.push("/login");
        }
      });
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createVNode(unref(At), {
            variant: "level1",
            type: "head-r"
          }, {
            default: withCtx(() => _cache[0] || (_cache[0] = [
              createTextVNode("Gl KVM Monitor", -1)
            ])),
            _: 1,
            __: [0]
          }),
          createBaseVNode("div", _hoisted_3, [
            createVNode(unref(Tooltip), { title: "Logout" }, {
              default: withCtx(() => [
                createVNode(unref(x), {
                  size: 24,
                  class: "pointer",
                  name: "gl-kvm-logout",
                  onClick: logout
                })
              ]),
              _: 1
            })
          ])
        ]),
        createBaseVNode("div", _hoisted_4, [
          createBaseVNode("div", _hoisted_5, [
            createVNode(LayoutKvmList, {
              onRemove: removeKvm,
              onAddToPage: handleConnectDevice
            })
          ]),
          createBaseVNode("div", _hoisted_6, [
            createVNode(LayoutKvmContent, {
              "kvm-list": state.kvmList
            }, null, 8, ["kvm-list"])
          ])
        ])
      ]);
    };
  }
});
const mainLayout = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-39af54f5"]]);
export {
  mainLayout as default
};
