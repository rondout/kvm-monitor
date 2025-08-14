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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATXPowerPressList = exports.ATXPowerPressEnum = void 0;
exports.isEqualJsonObj = isEqualJsonObj;
/*
 * @Author: shufei.han
 * @Date: 2024-11-25 15:29:30
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-29 15:40:17
 * @FilePath: \gl-kvm-frontend\src\models\state.model.ts
 * @Description: kvm的各种state有关的类型和数据
 */
var main_1 = require("@gl/main");
/** ATX power的三种按压功能 */
var ATXPowerPressEnum;
(function (ATXPowerPressEnum) {
    ATXPowerPressEnum["POWER"] = "power";
    ATXPowerPressEnum["POWER_LONG"] = "power_long";
    ATXPowerPressEnum["RESET"] = "reset";
})(ATXPowerPressEnum || (exports.ATXPowerPressEnum = ATXPowerPressEnum = {}));
/** ATXPower按钮列表 */
exports.ATXPowerPressList = [
    __assign({ tip: '0.5s' }, new main_1.SelectOptions(ATXPowerPressEnum.POWER, 'main.powerShort')),
    __assign({ tip: '6.5s' }, new main_1.SelectOptions(ATXPowerPressEnum.POWER_LONG, 'main.powerLong')),
    __assign({ tip: null }, new main_1.SelectOptions(ATXPowerPressEnum.RESET, 'main.restart')),
];
/** 判断两个JSON对象是否相等 */
function isEqualJsonObj(obj1, obj2) {
    // 处理基本类型和null/undefined的比较
    if (obj1 === obj2)
        return true;
    // 处理其中一个为null或undefined的情况
    if (obj1 == null || obj2 == null)
        return false;
    // 比较类型
    if (typeof obj1 !== typeof obj2)
        return false;
    // 处理数组比较
    if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2) || obj1.length !== obj2.length)
            return false;
        for (var i = 0; i < obj1.length; i++) {
            if (!isEqualJsonObj(obj1[i], obj2[i]))
                return false;
        }
        return true;
    }
    // 处理对象比较
    if (typeof obj1 === 'object') {
        var keys1 = Object.keys(obj1);
        var keys2 = Object.keys(obj2);
        // 比较键的数量
        if (keys1.length !== keys2.length)
            return false;
        // 检查所有键和值
        for (var _i = 0, keys1_1 = keys1; _i < keys1_1.length; _i++) {
            var key = keys1_1[_i];
            if (!keys2.includes(key))
                return false;
            if (!isEqualJsonObj(obj1[key], obj2[key]))
                return false;
        }
        return true;
    }
    // 其他情况视为不相等
    return false;
}
