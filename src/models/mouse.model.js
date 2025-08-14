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
exports.MouseEventHandler = exports.MouseButtonMap = exports.MouseEventType = exports.MouseButton = void 0;
/*
 * @Author: shufei.han
 * @Date: 2024-11-22 16:32:08
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-25 17:17:43
 * @FilePath: \gl-kvm-frontend\src\models\mouse.model.ts
 * @Description: 鼠标控制
 */
// import { useMsgStore } from "@/stores/modules/message";
var session_model_1 = require("./session.model");
var tools_1 = require("@/tools");
// import { useKvmStore, type KvmConfigState } from '@/stores/modules/kvm'
var main_1 = require("@gl/main");
var hid_model_1 = require("./hid.model");
// import { useServerStorageStore } from '@/stores/modules/serverStorage'
// import { ServerStorageKeys, type ServerStorageInfo } from './storage.model'
// const msgStore = useMsgStore();
/** 鼠标事件类型枚举 */
var MouseButton;
(function (MouseButton) {
    MouseButton[MouseButton["left"] = 0] = "left";
    MouseButton[MouseButton["middle"] = 1] = "middle";
    MouseButton[MouseButton["right"] = 2] = "right";
    MouseButton[MouseButton["up"] = 3] = "up";
    MouseButton[MouseButton["down"] = 4] = "down";
})(MouseButton || (exports.MouseButton = MouseButton = {}));
/** 鼠标事件对象类型枚举 */
var MouseEventType;
(function (MouseEventType) {
    MouseEventType["MOUSE_BUTTON"] = "mouse_button";
    MouseEventType["MOUSE_MOVE"] = "mouse_move";
    MouseEventType["MOUSE_RELATIVE"] = "mouse_relative";
    MouseEventType["MOUSE_WHEEL"] = "mouse_wheel";
})(MouseEventType || (exports.MouseEventType = MouseEventType = {}));
/** 鼠标类型对应的后端接受的key */
exports.MouseButtonMap = new Map([
    [MouseButton.left, "left"],
    [MouseButton.middle, "middle"],
    [MouseButton.right, "right"],
    [MouseButton.up, "up"],
    [MouseButton.down, "down"],
]);
var cumulativeScrolling = !(tools_1.browser.is_firefox && !tools_1.browser.is_mac);
/** 鼠标事件处理类 */
var MouseEventHandler = /** @class */ (function () {
    //   private kvmSore = useKvmStore();
    function MouseEventHandler(el, videoId, apiWs) {
        this.el = el;
        this.videoId = videoId;
        this.apiWs = apiWs;
        this.planned_pos = { x: 0, y: 0 };
        this.relative_touch_pos = null;
        this.sent_pos = { x: 0, y: 0 };
        this.scroll_delta = { x: 0, y: 0 };
        /** 鼠标是否hover在视频上面 */
        this.streamHovered = false;
        /** 鼠标是否hover在视频上面 */
        this.configState = {};
        //   private serverStorage: ServerStorageInfo;
        /** 鼠标滚轮速率 */
        this.relative_deltas = [];
        // this.configState = useKvmStore().configState;
        // this.serverStorage = useServerStorageStore().storage;
        log('[mouse] init', this.el, this.videoId);
        this.bindEvents();
        this.updateRate();
    }
    Object.defineProperty(MouseEventHandler.prototype, "absolute", {
        // private get videoId() {
        //   return this.kvmSore.videoElId;
        // }
        get: function () {
            return true;
            // return !(msgStore.hidState?.mouse?.absolute === false);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MouseEventHandler.prototype, "computedMousePolling", {
        /** 计算鼠标polling */
        get: function () {
            return hid_model_1.DEFAULT_MOUSE_POLLING;
            // if (this.absolute) {
            // }
            // return this.serverStorage[ServerStorageKeys.MOUSE_POLLING];
        },
        enumerable: false,
        configurable: true
    });
    /** 绑定事件 */
    MouseEventHandler.prototype.bindEvents = function () {
        var _this = this;
        this.el.addEventListener("wheel", function (e) { return _this.onMouseWheelScroll(e); });
        this.el.addEventListener("mouseenter", function (e) {
            return _this.onMouseLeaveOrEnter(e, true);
        });
        this.el.addEventListener("mouseleave", function (e) {
            return _this.onMouseLeaveOrEnter(e, false);
        });
        this.el.addEventListener("contextmenu", function (e) { return e.preventDefault(); });
        this.el.addEventListener("mousedown", function (e) { return _this.onMouseDown(e); });
        this.el.addEventListener("mouseup", function (e) { return _this.onMouseUp(e); });
        this.el.addEventListener("mousemove", function (e) { return _this.onMouseMove(e); });
        this.el.addEventListener("touchmove", function (e) { return _this.onTouchMove(e); });
        this.el.addEventListener("touchstart", function (e) { return _this.onTouchStart(e); });
        this.el.addEventListener("touchend", function () { return _this.onTouchEnd(); });
    };
    MouseEventHandler.prototype.onTouchStart = function (event) {
        // event.preventDefault()
        if (event.touches.length === 1) {
            if (this.absolute) {
                this.planned_pos = this.getTouchPosition(event.touches[0]);
                this.sendPlannedMove();
            }
            else {
                this.relative_touch_pos = this.getTouchPosition(event.touches[0]);
            }
        }
    };
    MouseEventHandler.prototype.onTouchEnd = function () {
        // event.preventDefault()
        this.sendPlannedMove();
    };
    /** 触摸移动事件（移动端兼容） */
    MouseEventHandler.prototype.onTouchMove = function (event) {
        // event.preventDefault()
        // @ts-ignore
        if (event.target.id !== this.videoId) {
            return;
        }
        if (event.touches.length === 1) {
            if (this.absolute) {
                this.planned_pos = this.getTouchPosition(event.touches[0]);
            }
            else if (this.relative_touch_pos === null) {
                this.relative_touch_pos = this.getTouchPosition(event.touches[0]);
            }
            else {
                var pos = this.getTouchPosition(event.touches[0]);
                this.sendOrPlanRelativeMove({
                    x: pos.x - this.relative_touch_pos.x,
                    y: pos.y - this.relative_touch_pos.y,
                });
                this.relative_touch_pos = pos;
            }
        }
    };
    MouseEventHandler.prototype.getTouchPosition = function (touch) {
        var _a;
        // @ts-ignore
        if ((_a = touch.target) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect) {
            // @ts-ignore
            var rect = touch.target.getBoundingClientRect();
            return {
                x: Math.round(touch.clientX - rect.left),
                y: Math.round(touch.clientY - rect.top),
            };
        }
        return null;
    };
    /** 鼠标进入或离开事件 */
    MouseEventHandler.prototype.onMouseLeaveOrEnter = function (event, enter) {
        this.streamHovered = enter;
    };
    /** 鼠标滚轮事件 */
    MouseEventHandler.prototype.onMouseWheelScroll = function (event) {
        event.preventDefault();
        var delta = { x: 0, y: 0 };
        // if ($("hid-mouse-cumulative-scrolling-switch").checked) {
        if (cumulativeScrolling) {
            var factor = tools_1.browser.is_mac ? 5 : 1;
            this.scroll_delta.x += event.deltaX * factor; // Horizontal scrolling
            if (Math.abs(this.scroll_delta.x) >= 100) {
                delta.x =
                    (this.scroll_delta.x / Math.abs(this.scroll_delta.x)) *
                        -hid_model_1.DEFAULT_SCROLL_RATE;
                this.scroll_delta.x = 0;
            }
            this.scroll_delta.y += event.deltaY * factor; // Vertical scrolling
            if (Math.abs(this.scroll_delta.y) >= 100) {
                delta.y =
                    (this.scroll_delta.y / Math.abs(this.scroll_delta.y)) *
                        -hid_model_1.DEFAULT_SCROLL_RATE;
                this.scroll_delta.y = 0;
            }
        }
        else {
            if (event.deltaX !== 0) {
                delta.x =
                    (event.deltaX / Math.abs(event.deltaX)) *
                        -hid_model_1.DEFAULT_SCROLL_RATE;
            }
            if (event.deltaY !== 0) {
                delta.y =
                    (event.deltaY / Math.abs(event.deltaY)) *
                        -hid_model_1.DEFAULT_SCROLL_RATE;
            }
        }
        this.sendScroll(delta);
    };
    Object.defineProperty(MouseEventHandler.prototype, "isPointerLocked", {
        get: function () {
            return document.pointerLockElement === this.el;
        },
        enumerable: false,
        configurable: true
    });
    /** 鼠标移动事件 */
    MouseEventHandler.prototype.onMouseMove = function (event) {
        log('mousemove', event);
        event.preventDefault();
        if (this.absolute) {
            // @ts-ignore
            var rect = event.target.getBoundingClientRect();
            this.planned_pos = {
                x: Math.max(Math.round(event.clientX - rect.left), 0),
                y: Math.max(Math.round(event.clientY - rect.top), 0),
            };
        }
        else if (this.isPointerLocked) {
            var x = event.movementX, y = event.movementY;
            this.sendOrPlanRelativeMove({ x: x, y: y });
        }
    };
    MouseEventHandler.prototype.sendOrPlanRelativeMove = function (delta) {
        delta = {
            x: Math.min(Math.max(-127, Math.floor((delta.x * hid_model_1.DEFAULT_RELATIVE_SENSE) /
                10)), 127),
            y: Math.min(Math.max(-127, Math.floor((delta.y * hid_model_1.DEFAULT_RELATIVE_SENSE) /
                10)), 127),
        };
        if (this.configState.squashRelativeMoves) {
            this.relative_deltas.push(delta);
        }
        else {
            this.sendEvent({
                event_type: MouseEventType.MOUSE_RELATIVE,
                event: { delta: delta },
            });
        }
    };
    MouseEventHandler.prototype.sendPlannedMove = function () {
        if (this.absolute) {
            if (this.planned_pos.x !== this.sent_pos.x ||
                this.planned_pos.y !== this.sent_pos.y) {
                // log('sendPlannedMove', this.planned_pos)
                var _a = this.planned_pos, x = _a.x, y = _a.y;
                var geo = (0, session_model_1.getGeometry)(this.videoId);
                var remapX = (0, session_model_1.remap)(x, geo.x, geo.width, -32768, 32767);
                var remapY = (0, session_model_1.remap)(y, geo.y, geo.height, -32768, 32767);
                this.sendEvent({
                    event_type: MouseEventType.MOUSE_MOVE,
                    event: { to: { x: remapX, y: remapY } },
                });
                this.sent_pos = this.planned_pos;
            }
        }
        else if (this.relative_deltas.length) {
            this.sendEvent({
                event_type: MouseEventType.MOUSE_RELATIVE,
                event: { delta: this.relative_deltas, squash: true },
            });
            this.relative_deltas = [];
        }
    };
    /** 鼠标按下事件 */
    MouseEventHandler.prototype.onMouseDown = function (event) {
        event.preventDefault();
        // @ts-ignore
        if (
        // @ts-ignore
        (this.absolute && event.target.id === this.videoId) ||
            // @ts-ignore
            event.target.id === "hdmi-lost") {
            var params = {
                event_type: MouseEventType.MOUSE_BUTTON,
                event: { button: exports.MouseButtonMap.get(event.button), state: true },
            };
            this.sendEvent(params);
        }
        // @ts-ignore
        else if (this.isPointerLocked && event.target.id === "stream-box") {
            // 如果是相对模式，则直接发送鼠标按下事件
            var params = {
                event_type: MouseEventType.MOUSE_BUTTON,
                event: { button: exports.MouseButtonMap.get(event.button), state: true },
            };
            this.sendEvent(params);
        }
    };
    /** 鼠标抬起事件 */
    MouseEventHandler.prototype.onMouseUp = function (event) {
        event.preventDefault();
        var params = {
            event_type: MouseEventType.MOUSE_BUTTON,
            event: { button: exports.MouseButtonMap.get(event.button), state: false },
        };
        this.sendEvent(params);
    };
    /** 发送鼠标滚轮事件 */
    MouseEventHandler.prototype.sendScroll = function (delta) {
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
                event: { delta: delta },
            });
        }
    };
    /** 发送鼠标事件 */
    MouseEventHandler.prototype.sendEvent = function (data) {
        // if (
        //   this.serverStorage[ServerStorageKeys.MOUSE_CONTROL] &&
        //   this.kvmSore.mouseEnabled
        // ) {
        (0, session_model_1.sendHidEvent)(this.apiWs, data);
        // }
    };
    MouseEventHandler.prototype.updateRate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.timer && clearTimeout(this.timer);
                        return [4 /*yield*/, (0, main_1.sleep)(this.computedMousePolling)];
                    case 1:
                        _a.sent();
                        this.sendPlannedMove();
                        this.updateRate();
                        return [2 /*return*/];
                }
            });
        });
    };
    return MouseEventHandler;
}());
exports.MouseEventHandler = MouseEventHandler;
