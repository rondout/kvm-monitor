/*
 * @Author: shufei.han
 * @Date: 2024-11-25 15:29:30
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-29 15:40:17
 * @FilePath: \gl-kvm-frontend\src\models\state.model.ts
 * @Description: kvm的各种state有关的类型和数据
 */
import { SelectOptions } from '@gl/main'
import { WsEventType } from './kvm.model'
import type { HidParams } from './hid.model'

export interface BaseEventState<T> {
    event_type: WsEventType;
    event: T;
}
/** hid事件消息结构 */
export interface HidEventState {
    online: boolean;
    busy: boolean;
    connected: null;
    keyboard: {
        online: boolean;
        leds: { caps: boolean; scroll: boolean; num: boolean };
        outputs: { available: []; active: string };
    };
    mouse: {
        outputs: { available: HidParams['mouse_output'][]; active: string };
        online: boolean;
        absolute: boolean;
    };
    jiggler: { enabled: boolean; active: boolean; interval: number };
}

export interface StreamerState {
    instance_id: '';
    encoder: { type: string; quality: number };
    h264: { bitrate: number; gop: number; online: boolean; fps: number };
    hdmi: { signal: boolean },
    sinks: { jpeg: { has_clients: boolean }; h264: { has_clients: boolean } };
    source: {
        resolution: { width: number; height: number };
        online: boolean;
        desired_fps: number;
        captured_fps: number;
    };
    stream: { queued_fps: number; clients: number; clients_stat: {} };
}

/** stream事件消息结构 */
export interface StreamEventState {
    limits: {
        desired_fps: { min: number; max: number };
        h264_bitrate: { min: number; max: number };
        h264_gop: { min: number; max: number };
    };
    params: { desired_fps: number; quality: number; h264_bitrate: number; h264_gop: number };
    snapshot: { saved: null };
    streamer: StreamerState;
    features: { quality: boolean; resolution: boolean; h264: boolean };
}
/** ATX power的三种按压功能 */
export enum ATXPowerPressEnum {
    POWER = 'power',
    POWER_LONG = 'power_long',
    RESET = 'reset',
}
/** ATXPower按钮列表 */
export const ATXPowerPressList = [
    { tip: '0.5s', ...new SelectOptions(ATXPowerPressEnum.POWER, 'main.powerShort') },
    { tip: '6.5s', ...new SelectOptions(ATXPowerPressEnum.POWER_LONG, 'main.powerLong') },
    { tip: null, ...new SelectOptions(ATXPowerPressEnum.RESET, 'main.restart') },
]
/** ATX Power的状态结构 */
export interface AtxEventState {
    /** 开关 */
    power: boolean;
    enabled: boolean;
}
/** 手指机器人的状态结构 */
export interface FingerbotEventState {
    exist: boolean;
}
export interface TurnMsgInfo {
    username: string;
    password: string;
    ttl: number;
    uris: string[]
}
/** 判断两个JSON对象是否相等 */
export function isEqualJsonObj (obj1: any, obj2: any) {
    // 处理基本类型和null/undefined的比较
    if (obj1 === obj2) return true
  
    // 处理其中一个为null或undefined的情况
    if (obj1 == null || obj2 == null) return false
  
    // 比较类型
    if (typeof obj1 !== typeof obj2) return false
  
    // 处理数组比较
    if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2) || obj1.length !== obj2.length) return false
    
        for (let i = 0; i < obj1.length; i++) {
            if (!isEqualJsonObj(obj1[i], obj2[i])) return false
        }
        return true
    }
  
    // 处理对象比较
    if (typeof obj1 === 'object') {
        const keys1 = Object.keys(obj1)
        const keys2 = Object.keys(obj2)
    
        // 比较键的数量
        if (keys1.length !== keys2.length) return false
    
        // 检查所有键和值
        for (const key of keys1) {
            if (!keys2.includes(key)) return false
            if (!isEqualJsonObj(obj1[key], obj2[key])) return false
        }
        return true
    }
  
    // 其他情况视为不相等
    return false
}