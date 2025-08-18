/*
 * @Author: shufei.han
 * @Date: 2024-10-16 11:26:20
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-02-15 14:31:36
 * @FilePath: \gl-kvm-frontend\src\api\websocket.ts
 * @Description: websocket请求封装
 */

export type WebsocketEventType = 'open' | 'connected' | 'message'

export const HEARTBEAT_INTERVAL = 2000
/** 心跳检测的最大时间 5 * 2000 */
export const HEARTBEAT_TIMEOUT = 5 * HEARTBEAT_INTERVAL
/** WS通信封装类 */
export class WebSocketService<T = any> {
  public socket: WebSocket
  public isOpen = false
  private heartBeatTimer: NodeJS.Timeout = null
  private eventCallbacks: Map<WebsocketEventType, (data?: any) => void> = new Map()
  constructor(
    private url: string,
    private protocol?: string,
    private onMessage?: (data: T) => void,
    private needHeartBeat = false
  ) {
    this.init()
  }

  private init() {
    this.socket = new WebSocket(this.url, this.protocol || undefined)
    this.configSocketLifeCircle()
  }
  /** 配置 socket 的生命周期 */
  private configSocketLifeCircle() {
    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.eventCallbacks.get('open')?.()
      this.needHeartBeat && this.sendHeartbeat()
      // useConfigStore().listenAndCheckHeartbeat()
      this.isOpen = true
    }
    this.socket.onclose = () => {
      console.log('WebSocket disconnected')
      this.isOpen = false
    }
    this.socket.onerror = (error) => {
      console.log('WebSocket error:', error)
      this.close()
      this.isOpen = false
    }
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // 监听心跳
      // if (data.event_type === WsEventType.PONG) {
      //     useConfigStore().updateLastHeartbeat()
      // }
      this.onMessage?.(data)
    }
  }
  /** 发送心跳 */
  private sendHeartbeat() {
    this.heartBeatTimer = setTimeout(() => {
      if (!this.isOpen) {
        log('heartbeat error')
        return
      }
      this.send(
        JSON.stringify({
          event_type: 'ping',
          event: {}
        })
      )
      this.sendHeartbeat()
    }, HEARTBEAT_INTERVAL)
  }
  /** 暴露出去的注册事件的方法 */
  public on(eventType: WebsocketEventType, callback: (data?: any) => void) {
    this.eventCallbacks.set(eventType, callback)
  }
  /** 发送消息 */
  public send<
    T extends string | ArrayBufferLike | Blob | ArrayBufferView<ArrayBufferLike> = string
  >(message: T) {
    this.socket.send(message)
  }
  /** 关闭连接 */
  public close() {
    this.heartBeatTimer && clearTimeout(this.heartBeatTimer)
    this.socket.close()
    this.isOpen = false
  }
}
