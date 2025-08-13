/*
 * @Author: shufei.han
 * @Date: 2024-11-11 10:29:17
 * @LastEditors: shufei.han
 * @LastEditTime: 2024-11-12 15:26:06
 * @FilePath: \webrtc-demo\server\tools\wsServer.ts
 * @Description:
 */
import { Server, type WebSocket } from 'ws'
import { parseCookies } from './utils'

export enum WsMsgTypes {
  CALL = 'call',
  RECEIVE_CALL = 'receive_call',
  ANSWER = 'answer',
  CONNECT_SUCCESS = 'connect_success',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  CHAT_MSG = 'chat_msg',
  ICE = 'ice',
  SDP = 'sdp'
}

export class WsMsgs {
  constructor(
    public type: WsMsgTypes,
    public data?: any
  ) {
    this.type = type
    this.data = data
  }

  public get content() {
    return JSON.stringify({ type: this.type, data: this.data })
  }
}

export class CallMsgs {
  constructor(
    public from: string,
    public to: string
  ) {
    this.from = from
    this.to = to
  }
}

export const handleMessage = async (msg: WsMsgs) => {
  switch (msg.type) {
    case WsMsgTypes.CALL:
      // 发送通话请求
      sendMsgToUser(msg.data.to, new WsMsgs(WsMsgTypes.CALL, msg.data).content)
      break
    case WsMsgTypes.ANSWER:
      // 接收通话请求
      sendMsgToUser(msg.data.to, new WsMsgs(WsMsgTypes.ANSWER, msg.data).content)
      break
    case WsMsgTypes.CHAT_MSG:
      // 收到连接成功消息
      //   await messageHandler.addMessage(msg.data)
      sendMsgToUser(msg.data.to, new WsMsgs(WsMsgTypes.CHAT_MSG, msg.data).content)
      sendMsgToUser(msg.data.from, new WsMsgs(WsMsgTypes.CHAT_MSG, msg.data).content)
      break
    case WsMsgTypes.SDP:
      sendMsgToUser(msg.data.to, new WsMsgs(WsMsgTypes.SDP, msg.data).content)
      break
    case WsMsgTypes.ICE:
      sendMsgToUser(msg.data.to, new WsMsgs(WsMsgTypes.ICE, msg.data).content)
      break
    default:
      break
  }
}

let allConnections: { user: string; ws: WebSocket }[] = []

export const getAllOnlineUsers = () => allConnections.map((item) => item.user)

async function handleConnect(ws: WebSocket, user: string) {
  if (user) {
    allConnections.push({ user, ws })
    console.log(user, 'is online!!')
    ws.send(new WsMsgs(WsMsgTypes.CONNECT_SUCCESS).content)
    sendToAllUser(new WsMsgs(WsMsgTypes.USER_ONLINE, user))
  } else {
    ws.send(500)
  }
}

async function sendToAllUser(msg: WsMsgs) {
  try {
    allConnections.forEach((item) => {
      item.ws.send(msg.content)
    })
  } catch (error) {
    console.log(error)
  }
}

async function sendMsgToUser(user: string, msg: string) {
  const conn = allConnections.find((item) => item.user === user)
  if (conn) {
    conn.ws.send(msg)
  }
}

export default function configWsServer(wsServer: Server) {
  wsServer.on('connection', (ws, req) => {
    const user = parseCookies(req.headers.cookie).user
    handleConnect(ws, user)
    ws.on('message', (data) => {
      handleMessage(JSON.parse(data.toString()))
    })
    ws.on('close', () => {
      allConnections = allConnections.filter((item) => item.user !== user)
      sendToAllUser(new WsMsgs(WsMsgTypes.USER_OFFLINE, user))
    })
  })
  wsServer.on('close', () => {
    console.log('close')
  })
}
