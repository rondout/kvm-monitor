"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.JanusStreamer = exports.nullFn = exports.$$$ = exports.$$ = exports.$ = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * @Author: shufei.han
 * @Date: 2024-11-20 16:21:48
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-29 17:39:23
 * @FilePath: \gl-kvm-frontend\src\models\janus.model.ts
 * @Description: janus 有关的配置和方法
 */
var janus_1 = require("@/tools/janus");
// import { useKvmStore, type KvmConfigState, type StreamInfoTuple } from '@/stores/modules/kvm'
// import { useMsgStore } from '@/stores/modules/message'
// import { t } from '@/hooks/useLanguage'
// import { useServerStorageRef } from '@/hooks/useServerStorage'
// import { ServerStorageKeys } from './storage.model'
// import { useSystemStore } from '@/stores/modules/system'
var main_1 = require("@gl/main");
var $ = function (id) {
    return document.getElementById(id);
};
exports.$ = $;
// @ts-ignore
var $$ = function (cls) { return [].slice.call(document.getElementsByClassName(cls)); };
exports.$$ = $$;
var $$$ = function (selector) { return document.querySelectorAll(selector); };
exports.$$$ = $$$;
var nullFn = function () { };
exports.nullFn = nullFn;
var JanusStreamer = /** @class */ (function () {
    // private meter: ReturnType<typeof createVolumeMeter>
    function JanusStreamer(kvm, el, config, 
    // private configState: KvmConfigState,
    allow_audio, allow_video, onRemoteTrack, onLocalTrack, onSdpStatus) {
        if (allow_video === void 0) { allow_video = true; }
        var _this = this;
        this.kvm = kvm;
        this.el = el;
        this.allow_audio = allow_audio;
        this.allow_video = allow_video;
        this.onRemoteTrack = onRemoteTrack;
        this.onLocalTrack = onLocalTrack;
        this.onSdpStatus = onSdpStatus;
        /** 是否是手动停止了janus */
        this.stop = false;
        this.ensuring = false;
        this.retry_ensure_timeout = null;
        this.retry_emsg_timeout = null;
        this.info_interval = null;
        this.state = null;
        this.frames = 0;
        this.setActive = exports.nullFn;
        this.setInactive = exports.nullFn;
        this.setInfo = exports.nullFn;
        // const allow_mic = false
        // this.allow_camera = allow_video && configState.cameraOn
        // this.allow_mic = allow_mic && !allow_video
        // this.allow_mic = allow_audio && allow_mic
        this.setActive = config.setActive || (exports.nullFn);
        this.setInactive = config.setInactive || (exports.nullFn);
        this.setInfo = config.setInfo || (exports.nullFn);
        this.rtcConfig = config.rtcConfig;
        this.initJanus(function () {
            _this.ensureJanus();
        });
    }
    JanusStreamer.prototype.ensureStream = function () {
        this.ensureJanus();
    };
    JanusStreamer.prototype.initJanus = function (callback) {
        var _this = this;
        janus_1.Janus.init({
            debug: 'all',
            id: this.kvm.id,
            callback: function () {
                _this._Janus = janus_1.Janus;
                callback();
            },
        });
    };
    JanusStreamer.prototype.attachJanus = function () {
        var _this = this;
        var janus = this.janus;
        if (janus === null) {
            return;
        }
        janus.attach({
            plugin: 'janus.plugin.ustreamer',
            opaqueId: 'oid-' + this._Janus.randomString(12),
            success: function (handle) {
                _this.handle = handle;
                _this.sendWatch();
            },
            error: function (error) {
                // log('Can\'t attach uStreamer: ', error)
                _this.setInfo(false, false, error);
                _this.destroyJanus();
            },
            connectionState: function (state) {
                // log('Peer connection state changed to', state)
                if (state === 'failed') {
                    _this.destroyJanus();
                }
            },
            iceState: function (state) {
                // log('ICE state changed to', state)
            },
            webrtcState: function (up) {
                // log(
                //     'Janus says our WebRTC PeerConnection is',
                //     up ? 'up' : 'down',
                //     'now',
                // )
                if (up) {
                    _this.sendKeyRequired();
                }
            },
            onmessage: function (msg, jsep) {
                _this.stopRetryEmsgInterval();
                if (msg.result) {
                    // log('Got uStreamer result message:', msg.result.status) // starting, started, stopped
                    if (msg.result.status === 'started') {
                        _this.setActive();
                        _this.setInfo(false, false, '');
                    }
                    else if (msg.result.status === 'stopped') {
                        _this.setInactive();
                        _this.setInfo(false, false, '');
                    }
                    else if (msg.result.status === 'features') {
                        // tools.feature.setEnabled($("stream-audio"), msg.result.features.audio);
                        // tools.feature.setEnabled($('stream-mic'), msg.result.features.mic)
                        // this.sendWatch()
                    }
                }
                else if (msg.error_code || msg.error) {
                    // log('Got uStreamer error message:', msg.error_code, '-', msg.error)
                    _this.setInfo(false, false, msg.error);
                    if (_this.retry_emsg_timeout === null) {
                        _this.retry_emsg_timeout = setTimeout(function () {
                            if (!_this.stop) {
                                _this.sendStop();
                                _this.sendWatch();
                            }
                            _this.retry_emsg_timeout = null;
                        }, 2000);
                    }
                    return;
                }
                else {
                    log('Got uStreamer other message:', msg);
                }
                if (jsep) {
                    // log('Handling SDP:', jsep)
                    var tracks = [{ type: 'video', capture: _this.allow_camera, recv: true, add: true }];
                    if (_this.allow_audio || _this.allow_mic) {
                        tracks.push({ type: 'audio', capture: _this.allow_mic, recv: _this.allow_audio, add: true });
                    }
                    _this.handle.createAnswer({
                        jsep: jsep,
                        tracks: tracks,
                        // media: { audioSend: false, videoSend: false, data: false },
                        // Chrome is playing OPUS as mono without this hack
                        //   - https://issues.webrtc.org/issues/41481053 - IT'S NOT FIXED!
                        //   - https://github.com/ossrs/srs/pull/2683/files
                        customizeSdp: function (jsep) {
                            jsep.sdp = jsep.sdp.replace('useinbandfec=1', 'useinbandfec=1;stereo=1');
                        },
                        success: function (jsep) {
                            var _a;
                            _this.sendStart(jsep);
                            (_a = _this.onSdpStatus) === null || _a === void 0 ? void 0 : _a.call(_this, true);
                        },
                        error: function (error) {
                            var _a;
                            (_a = _this.onSdpStatus) === null || _a === void 0 ? void 0 : _a.call(_this, false);
                            _this.setInfo(false, false, error);
                            _this.destroyJanus();
                        },
                    });
                }
            },
            // Janus 1.x
            onremotetrack: function (track, id, added, meta) {
                // Chrome sends `muted` notification for tracks in `disconnected` ICE state
                // and Janus.js just removes muted track from list of available tracks.
                // But track still exists actually so it's safe to just ignore
                // reason == "mute" and "unmute".
                var reason = (meta || {}).reason;
                // log('Got onremotetrack:', id, added, reason, track, meta)
                if (added && reason === 'created') {
                    _this.addTrack(track);
                    if (track.kind === 'video') {
                        _this.sendKeyRequired();
                        _this.startInfoInterval();
                        _this.getConnectionType();
                    }
                }
                else if (!added && reason === 'ended') {
                    _this.removeTrack(track);
                }
            },
            onlocaltrack: function (track) {
                // // @ts-ignore
                // const el = document.querySelector('#local-stream-video') as HTMLVideoElement
                // el.srcObject = null
                // if (this.allow_mic && track.kind === 'audio') {
                //     this.micTrack = track
                //     // requestAnimationFrame(console.log(getCurrentVolume(track)))
                //     this.meter = createVolumeMeter(track)
                //     this.meter.start(v => {
                //         // log('volume: ', v)
                //         useKvmStore().setMicVolume(v)
                //     })
                //     if (useSystemStore().state.micMuted) {
                //         this.setMicEnabled(false)
                //     }
                // }
                // this.addTrack(track, el)
                // this.onLocalTrack?.(track)
            },
            oncleanup: function () {
                // log('Got a cleanup notification')
                _this.stopInfoInterval();
            },
        });
    };
    JanusStreamer.prototype.getConnectionType = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 5]);
                        return [4 /*yield*/, this.handle.getRtcStats()];
                    case 1:
                        res = _a.sent();
                        if (res.enabled) {
                            this.connectionType = res.type;
                        }
                        return [4 /*yield*/, (0, main_1.sleep)(5000)];
                    case 2:
                        _a.sent();
                        this.getConnectionType();
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        return [4 /*yield*/, (0, main_1.sleep)(5000)];
                    case 4:
                        _a.sent();
                        this.getConnectionType();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    JanusStreamer.prototype.setMicEnabled = function (enabled) {
        if (this.micTrack) {
            this.micTrack.enabled = enabled;
            return true;
        }
        return false;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    JanusStreamer.prototype.ensureJanus = function () {
        var _this = this;
        log('ensureJanus', this.kvm);
        var wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
        var config = __assign(__assign({ server: "".concat(wsProtocol, "://").concat(location.host, "/kvm/").concat(this.kvm.id, "/janus/ws"), success: function () {
                _this.attachJanus();
            } }, (this.rtcConfig || {})), { 
            // 第二个参数可选，如果传了，就用这个code去翻译，没传就用err
            error: function (err) {
                var errorEnum = janus_1.JANUS_ERROR_TO_JANUS_ENUM_MAP.get(err);
                if (errorEnum !== undefined) {
                    _this.setInfo(false, false, ('error.' + errorEnum));
                }
                else {
                    _this.setInfo(false, false, err);
                }
                _this.__finishJanus();
            }, destroyOnUnload: false });
        log('WebRTC Config: ', config);
        this.janus = new this._Janus(config);
        // log(this.janus)
        // @ts-ignore
    };
    JanusStreamer.prototype.destroyJanus = function () {
        try {
            if (this.janus !== null) {
                this.janus.destroy();
            }
            this.__finishJanus();
            var stream = this.el.srcObject;
            if (stream) {
                // @ts-ignore
                for (var _i = 0, _a = stream.getTracks(); _i < _a.length; _i++) {
                    var track = _a[_i];
                    this.removeTrack(track);
                }
            }
        }
        catch (error) {
            // 
        }
    };
    JanusStreamer.prototype.stopStream = function () {
        this.stop = true;
        this.destroyJanus();
        // this.meter?.stop?.()
        // useKvmStore().setMicVolume(null)
    };
    JanusStreamer.prototype.__finishJanus = function () {
        var _this = this;
        if (this.stop) {
            if (this.retry_ensure_timeout !== null) {
                clearTimeout(this.retry_ensure_timeout);
                this.retry_ensure_timeout = null;
            }
            this.ensuring = false;
        }
        else {
            if (this.retry_ensure_timeout === null) {
                this.retry_ensure_timeout = setTimeout(function () {
                    _this.retry_ensure_timeout = null;
                    _this.ensureJanus();
                }, 5000);
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
            this.setInfo(false, false, '');
        }
    };
    JanusStreamer.prototype.stopRetryEmsgInterval = function () {
        if (this.retry_emsg_timeout !== null) {
            clearTimeout(this.retry_emsg_timeout);
            this.retry_emsg_timeout = null;
        }
    };
    JanusStreamer.prototype.stopInfoInterval = function () {
        if (this.info_interval !== null) {
            clearInterval(this.info_interval);
        }
        this.info_interval = null;
    };
    JanusStreamer.prototype.isOnline = function () {
        // return useMsgStore().isStreamOnline
    };
    JanusStreamer.prototype.sendKeyRequired = function () { };
    JanusStreamer.prototype.startInfoInterval = function () {
        var _this = this;
        this.stopInfoInterval();
        this.setActive();
        this.updateInfo();
        this.info_interval = setInterval(function () { return _this.updateInfo(); }, 1000);
    };
    JanusStreamer.prototype.updateInfo = function () {
        try {
            if (this.handle !== null) {
                var info = '';
                var fps = null;
                if (this.handle !== null) {
                    // https://wiki.whatwg.org/wiki/Video_Metrics
                    var frames_1 = null;
                    // @ts-ignore
                    var el = this.el;
                    // @ts-ignore
                    if (el.webkitDecodedFrameCount !== undefined) {
                        // @ts-ignore
                        frames_1 = el.webkitDecodedFrameCount;
                        // @ts-ignore
                    }
                    else if (el.mozPaintedFrames !== undefined) {
                        // @ts-ignore
                        frames_1 = el.mozPaintedFrames;
                    }
                    info = "".concat(this.handle.getBitrate()).replace('kbits/sec', 'kbps');
                    if (frames_1 !== null) {
                        fps = Math.max(0, (frames_1 - this.frames));
                        // fps = Math.max(0, Math.round((frames - this.frames) / 2))
                        info += " / ".concat(fps, " fps ") + ('dynamic');
                        this.frames = frames_1;
                    }
                }
                this.setInfo(true, this.isOnline(), info, { fps: fps, connectionType: this.connectionType });
            }
        }
        catch (error) {
            // 
        }
    };
    JanusStreamer.prototype.sendStop = function () {
        this.stopInfoInterval();
        if (this.handle) {
            // log('Sending STOP ...')
            this.handle.send({ message: { request: 'stop' } });
            this.handle.hangup();
        }
    };
    JanusStreamer.prototype.sendWatch = function () {
        if (this.handle) {
            this.handle.send({ message: { request: 'features' } });
            log('send watch: ', {
                orientation: this.getOrientation(),
                audio: this.allow_audio || this.allow_mic,
                video: this.allow_video,
                mic: this.allow_mic,
                camera: this.allow_camera,
            });
            this.handle.send({
                message: {
                    request: 'watch',
                    params: {
                        orientation: this.getOrientation(),
                        audio: this.allow_audio || this.allow_mic,
                        video: this.allow_video,
                        mic: this.allow_mic,
                        camera: this.allow_camera,
                    },
                },
            });
        }
    };
    JanusStreamer.prototype.addTrack = function (track, el) {
        var _a;
        if (el === void 0) { el = this.el; }
        if (el.srcObject) {
            // @ts-ignore
            for (var _i = 0, _b = el.srcObject.getTracks(); _i < _b.length; _i++) {
                var tr = _b[_i];
                if (tr.kind === track.kind && tr.id !== track.id) {
                    this.removeTrack(tr);
                }
            }
        }
        if (!el.srcObject) {
            el.srcObject = new MediaStream();
            (_a = this.onRemoteTrack) === null || _a === void 0 ? void 0 : _a.call(this);
        }
        // @ts-ignore
        el.srcObject.addTrack(track);
    };
    JanusStreamer.prototype.removeTrack = function (track) {
        var el = this.el;
        if (!el.srcObject) {
            return;
        }
        track.stop();
        // @ts-ignore
        el.srcObject.removeTrack(track);
        // @ts-ignore
        if (el.srcObject.getTracks().length === 0) {
            // MediaStream should be destroyed to prevent old picture freezing
            // on Janus reconnecting.
            el.srcObject = null;
        }
    };
    JanusStreamer.prototype.sendStart = function (jsep) {
        if (this.handle) {
            this.handle.send({ message: { request: 'start' }, jsep: jsep });
        }
    };
    JanusStreamer.prototype.getOrientation = function () {
        // return useServerStorageRef(ServerStorageKeys.ORIENTATION).value
    };
    JanusStreamer.prototype.isAudioAllowed = function () {
        return this.allow_audio;
    };
    JanusStreamer.prototype.getName = function () {
        var name = 'WebRTC H.264';
        if (this.allow_audio) {
            name += ' + Audio';
        }
        if (this.allow_mic) {
            name += ' + Mic';
        }
        return name;
    };
    JanusStreamer.prototype.getMode = function () {
        return 'janus';
    };
    JanusStreamer.prototype.getResolution = function () {
        if (this.el instanceof HTMLVideoElement) {
            var el = this.el;
            return {
                real_width: el.videoWidth || el.offsetWidth,
                real_height: el.videoHeight || el.offsetHeight,
                view_width: el.offsetWidth,
                view_height: el.offsetHeight,
            };
        }
    };
    return JanusStreamer;
}());
exports.JanusStreamer = JanusStreamer;
