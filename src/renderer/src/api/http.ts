/*
 * @Author: shufei.han
 * @Date: 2024-11-26 11:11:38
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-23 10:24:13
 * @FilePath: \gl-kvm-frontend\src\api\request.ts
 * @Description: http请求封装
 */
import { HttpService } from '@gl/main'
import type { AxiosError } from 'axios'

export const NOT_AUTHORIZED_CODE = 401
export const NOT_PERMISSION_CODE = 403
/** 默认的请求超时时间 */
export const DEFAULT_REQUEST_TIMEOUT = 30000
/** 展示登录过期确认弹窗是否已经开启 */

export const httpService = new HttpService(
  { timeout: DEFAULT_REQUEST_TIMEOUT, apiPrefix: '/cloud-basic', baseURL: 'http://localhost:4004' },
  () => {},
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (response) => {
    log(response)
    const res = { data: { info: response.data?.info } }
    return res
  },
  (error: AxiosError) => {
    // const isLoggedIn = useUserStore().isLoggedIn
    // const isCheckStatusApi = error.config?.url?.includes('/api/auth/check')
    // // 这里要判断是不是升级中页面
    // if (isLoggedIn && !isUpgradingPage()) {
    //   if (
    //     isCheckStatusApi &&
    //     [NOT_PERMISSION_CODE, NOT_AUTHORIZED_CODE].includes(error.response?.status)
    //   ) {
    //     if (!loginAgainConfirmOpen) {
    //       reloadPage()
    //     }
    //     // 避免重复弹出确认框
    //     loginAgainConfirmOpen = true
    //   }
    // }
    return Promise.reject(error)
  }
)
