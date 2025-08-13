/*
 * @Author: shufei.han
 * @Date: 2024-11-07 16:21:33
 * @LastEditors: shufei.han
 * @LastEditTime: 2024-11-11 14:52:40
 * @FilePath: \webrtc-demo\server\tools\index.ts
 * @Description:
 */
import { resolve } from 'path'

export class BaseResponse<T> {
  constructor(
    public success: boolean = true,
    public info?: T
  ) {}
}

export const kvmListPath = resolve(__dirname, './db/kvm-list.json')
