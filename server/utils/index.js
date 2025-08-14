"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = parseCookies;
exports.parseUrlQuery = parseUrlQuery;
/*
 * @Author: shufei.han
 * @Date: 2024-11-11 10:56:51
 * @LastEditors: shufei.han
 * @LastEditTime: 2024-11-11 11:06:55
 * @FilePath: \webrtc-demo\server\tools\util.ts
 * @Description:
 */
function parseCookies(cookies) {
    try {
        var cookieObj = {};
        // 分割 Cookie 字符串
        var cookieArray = cookies.split("; ");
        // 遍历每个 Cookie 键值对
        for (var _i = 0, cookieArray_1 = cookieArray; _i < cookieArray_1.length; _i++) {
            var cookie = cookieArray_1[_i];
            var _a = cookie.split("="), key = _a[0], value = _a[1];
            if (key && value) {
                cookieObj[key.trim()] = decodeURIComponent(value.trim());
            }
        }
        return cookieObj;
    }
    catch (_b) {
        return {};
    }
}
/** 从url中获取查询参数数据 */
function parseUrlQuery(url) {
    if (url === void 0) { url = window.location.href; }
    try {
        var query = url.split("?")[1];
        var params = new URLSearchParams(query);
        console.log(query);
        var result_1 = {};
        params.forEach(function (value, key) {
            result_1[key] = value;
        });
        return result_1;
    }
    catch (error) {
        return {};
    }
}
