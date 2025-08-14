/*
 * @Author: shufei.han
 * @Date: 2024-11-07 16:17:49
 * @LastEditors: shufei.han
 * @LastEditTime: 2024-11-11 14:54:11
 * @FilePath: \webrtc-demo\server\tools\httpServer.ts
 * @Description:
 */
import express from 'express'
import logger from 'morgan'
import { BaseResponse } from './models'
import { connectKvm, getCookiesById, getKvmAppsFromDb, getKvmDeviceById, saveKvmAppsToDb } from './models/kvm.model'
import { createProxyMiddleware } from 'http-proxy-middleware'

const HTTP_PORT = 4004
// @ts-ignore
export const app = express()

// @ts-ignore
app.use(logger('dev'))
app.use(express.json())

// app.get('/', (_, res) => {
//   res.send('Hello World!')
// })

// app.get('/api/kvm/list', async (_, res) => {
//   const list = await getKvmAppsFromDb()
//   res.send(new BaseResponse(true, list))
// })

// app.post('/api/kvm/add', async (req, res) => {
//   const success = await saveKvmAppsToDb(req.body)
//   console.log(success, req.body);
//   if(success) {
//     return res.send(new BaseResponse(true, req.body, 'Add kvm success!'))
//   }
//   res.status(500).send(new BaseResponse(false, req.body, 'Add kvm error!'))
// })

// app.post('/api/kvm/connect', async (req, res) => { 
//   try {
//     const success = await connectKvm(req.query.id as string)
//     if(success) {
//       res.send(new BaseResponse(true, 'Connect kvm success!')) 
//     }else {
//       throw new Error('Connect kvm error!')
//     }
//   } catch (error) {
//     res.status(500).send(new BaseResponse(false, error, 'Connect kvm error!'))
//   }
// })

// app.post('/api/login', async (req) => {
//   try {
//     const data = req.body
//     // res.cookie('user', user.username).send(new BaseResponse(true, user))
//     console.log(data)
//   } catch {
//     // res.status(500).send(new BaseResponse(false, error))
//   }
// })

app.use('/', createProxyMiddleware({
    target: 'https://192.168.60.85/',
    secure: false, // 如果目标服务器没有有效的SSL证书，可以禁用SSL验证
    changeOrigin: true,
    // @ts-ignore
    logLevel: 'debug', // 启用详细日志
    ws: true,
}));

const server = app.listen(HTTP_PORT, undefined, () =>
  console.log('listening on: http://localhost:' + HTTP_PORT)
)
