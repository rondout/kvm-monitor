/*
 * @Author: shufei.han
 * @Date: 2024-11-21 14:43:06
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-03-28 17:22:19
 * @FilePath: \gl-kvm-frontend\src\models\session.model.ts
 * @Description: 和janus服务通信的一些方法
 */
// import type { WebviewMsg } from 'env'
import { $ } from './janus.model'
import type { WebSocketService } from '@renderer/api/websocket'
// import { useKvmStore } from '@renderer/stores/modules/kvm'

// @ts-ignore
const __ascii_encoder = new TextEncoder('ascii')

export function sendHidEvent (ws: { send: WebSocketService['send'] }, { event_type, event }) {
    log('[hid] send', event_type, event, ws)
    if (!ws) {
        return
    }
    if (event_type == 'key') {
        const data = __ascii_encoder.encode('\x01\x00' + event.key)
        data[1] = (event.state ? 1 : 0)
        ws.send(data)
    } else if (event_type == 'mouse_button') {
        const data = __ascii_encoder.encode('\x02\x00' + event.button)
        data[1] = (event.state ? 1 : 0)
        ws.send(data)

    } else if (event_type == 'mouse_move') {
        const data = new Uint8Array([
            3,
            (event.to.x >> 8) & 0xFF, event.to.x & 0xFF,
            (event.to.y >> 8) & 0xFF, event.to.y & 0xFF,
        ])
        ws.send(data)

    } else if (event_type == 'mouse_relative' || event_type == 'mouse_wheel') {
        let data
        if (Array.isArray(event.delta)) {
            data = new Int8Array(2 + event.delta.length * 2)
            let index = 0
            for (const delta of event.delta) {
                data[index + 2] = delta['x']
                data[index + 3] = delta['y']
                index += 2
            }
        } else {
            data = new Int8Array([0, 0, event.delta.x, event.delta.y])
        }
        data[0] = (event_type == 'mouse_relative' ? 4 : 5)
        data[1] = (event.squash ? 1 : 0)
        ws.send(data)
    }
}

export function remap (x: number, a1: number, b1: number, a2: number, b2: number) {
    const remapped = Math.round((x - a1) / b1 * (b2 - a2) + a2)
    if (remapped < a2) {
        return a2
    } else if (remapped > b2) {
        return b2
    }
    return remapped
}

export function getResolution (el: HTMLVideoElement | HTMLCanvasElement) {
    if (el instanceof HTMLVideoElement) {
        return {
            real_width: (el.videoWidth || el.offsetWidth),
            real_height: (el.videoHeight || el.offsetHeight),
            view_width: el.offsetWidth,
            view_height: el.offsetHeight,
        }
    } else {
        return {
            real_width: (el.width || el.offsetWidth),
            real_height: (el.height || el.offsetHeight),
            view_width: el.offsetWidth,
            view_height: el.offsetHeight,
        }
    }
}

export function getGeometry (id: string) {
    const el = $(id)
    const res = getResolution(el)
    const ratio = Math.min(res.view_width / res.real_width, res.view_height / res.real_height)
    return {
        x: Math.round((res.view_width - ratio * res.real_width) / 2),
        y: Math.round((res.view_height - ratio * res.real_height) / 2),
        width: Math.round(ratio * res.real_width),
        height: Math.round(ratio * res.real_height),
        real_width: res.real_width,
        real_height: res.real_height,
    }
}
/** 是否是通过webview访问 */
// export const isWebview = () => {
//     return window.chrome?.webview || window.webkit?.messageHandlers?.KVM || window.top !== window.self
// }

/** 给webview发送消息 */
// export function sendMsgToWebview <T> (data: WebviewMsg<T>) {
//     const jsonData = JSON.stringify(data)
//     log('发送消息给webview', data, jsonData)
//     if (window.chrome?.webview) {
//         // Windows
//         try {
//             window.chrome.webview.postMessage(jsonData)
//             console.log('Windows 消息发送成功')
//             return true
//         } catch (e) {
//             console.error('Windows 消息发送失败:', e)
//             return false
//         }
//     } else if (window.webkit?.messageHandlers?.KVM) {
//         // macOS
//         try {
//             window.webkit.messageHandlers.KVM.postMessage(jsonData)
//             console.log('macOS 消息发送成功')
//             return true
//         } catch (e) {
//             console.error('macOS 消息发送失败:', e)
//             return false
//         }
//     } else if (isWebview() && window.parent?.postMessage) {
//         try {
//             window.parent.postMessage(jsonData, {
//                 targetOrigin: '*',
//             })
//             console.log('父窗口消息发送成功')
//             return true
//         } catch (e) {
//             console.error('父窗口消息发送失败:', e)
//             return false
//         }
//     } else {
//         console.error('未找到可用的消息处理器')
//         return false
//     }
// }

/** 打开新窗口（需要兼容webview） */
export function openAnotherWindow (url: string) {
    const newWindow = window.open(url, '_blank')
    log(newWindow)
}