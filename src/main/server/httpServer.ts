/*
 * @Author: shufei.han
 * @Description: 修复WebSocket代理同时保留原有HTTP代理
 */
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import http from 'http'
import {
  connectKvm,
  deleteKvmDevicesFromDb,
  getKvmDeviceById,
  getKvmDevicesFromDb,
  initDb,
  saveKvmDevicesToDb
} from './models/kvm.model'
import { BaseResponse } from './models'
import { nanoid } from 'nanoid'
import cors from 'cors'

const HTTP_PORT = 4004
const app = express()

// 中间件配置
app.use(express.json())
app.use(express.static('dist'))
// 在API服务中添加CORS头部（Node.js示例）
app.use(cors())
app.use((req, _, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`)
  next()
})

// 存储设备代理配置
const deviceProxies = new Map<string, ReturnType<typeof createProxyMiddleware>>()

app.post('/api/kvm/add', async (req, res) => {
  console.log('[POST] /api/kvm/add', nanoid)

  const id = nanoid()
  try {
    const kvm = { ...req.body, id }
    const success = await saveKvmDevicesToDb(kvm)
    console.log('Save Kvm to db Result: ', success)
    const device = await getKvmDeviceById(id)
    console.log('Get Kvm from db Result(current after save): ', device)

    if (success) {
      await connectKvm(id)
      await initProxies()
      res.send(new BaseResponse(true, req.body, 'Add kvm success!'))
      return
    } else {
      throw new Error('Connect kvm failed!')
    }
  } catch {
    await deleteKvmDevicesFromDb(id)
    res.status(500).send(new BaseResponse(false, req.body, 'Add kvm error!'))
  }
})

app.post('/api/kvm/connect', async (req, res) => {
  try {
    const success = await connectKvm(req.query.id as string)
    if (success) {
      res.send(new BaseResponse(true, 'Connect kvm success!'))
    } else {
      throw new Error('Connect kvm error!')
    }
  } catch (error) {
    res.status(500).send(new BaseResponse(false, error, 'Connect kvm error!'))
  }
})

// app.post('/api/login', async (req) => {
//   try {
//     const data = req.body
//     // res.cookie('user', user.username).send(new BaseResponse(true, user))
//     console.log(data)
//   } catch {
//     // res.status(500).send(new BaseResponse(false, error))
//   }
// })

app.get('/api/kvm/list', async (_, res) => {
  const list = await getKvmDevicesFromDb()
  res.send(new BaseResponse(true, list))
})

// 初始化代理
const initProxies = async () => {
  const kvmList = await getKvmDevicesFromDb()

  kvmList.forEach((item) => {
    const proxyPath = `/kvm-api/${item.id}`
    const target = `https://${item.ip}`

    // 创建HTTP代理中间件
    const proxy = createProxyMiddleware({
      target,
      secure: false,
      changeOrigin: true,
      // @ts-ignore
      logLevel: 'debug',
      // pathRewrite: {
      //   [`^${proxyPath}`]: '/api'  // 移除设备ID前缀
      // },
      pathRewrite: (path) => {
        const originPath = path
        const newPath = path.replace(proxyPath, '')
        console.log('path', { originPath, path, newPath, proxyPath })
        return newPath
      },
      headers: {
        Cookie: item.cookie
      }
    })

    // 注册代理中间件
    app.use(proxyPath, proxy)
    // @ts-ignore
    deviceProxies.set(item.id, proxy)

    console.log(`[Proxy] Registered ${item.id} -> ${target}`)
  })
}

// 创建HTTP服务器
const server = http.createServer(app)

// 单独处理WebSocket升级请求
server.on('upgrade', (req, socket, head) => {
  try {
    const deviceId = req.url?.split('/')[2] // 从/kvm-api/DEVICE_ID/...提取
    const proxy = deviceId ? deviceProxies.get(deviceId) : null

    if (!proxy) {
      console.error(`[WS] Device ${deviceId} not found`)
      socket.destroy()
      return
    }

    // 调用原始中间件的upgrade处理
    // @ts-ignore
    proxy.upgrade(req, socket, head)
  } catch (err) {
    console.error('[WS] Proxy error:', err)
    socket.destroy()
  }
})

// 启动服务
export const start = async () => {
  await initDb()
  await initProxies()

  server.listen(HTTP_PORT, () => {
    console.log(`
      Server running on port ${HTTP_PORT}
      HTTP Proxy: http://localhost:${HTTP_PORT}/kvm-api/:deviceId/...
      WS Proxy:   ws://localhost:${HTTP_PORT}/kvm-api/:deviceId/ws
    `)
  })
}
