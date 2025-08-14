"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseResponse = void 0;
/*
 * @Author: shufei.han
 * @Date: 2024-11-07 16:21:33
 * @LastEditors: shufei.han
 * @LastEditTime: 2024-11-11 14:52:40
 * @FilePath: \webrtc-demo\server\tools\index.ts
 * @Description:
 */
var BaseResponse = /** @class */ (function () {
    function BaseResponse(success, info, msg) {
        if (success === void 0) { success = true; }
        this.success = success;
        this.info = info;
        this.msg = msg;
    }
    return BaseResponse;
}());
exports.BaseResponse = BaseResponse;
