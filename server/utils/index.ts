/*
 * @Author: shufei.han
 * @Date: 2024-11-11 10:56:51
 * @LastEditors: shufei.han
 * @LastEditTime: 2024-11-11 11:06:55
 * @FilePath: \webrtc-demo\server\tools\util.ts
 * @Description:
 */
export function parseCookies(cookies: string): { [key: string]: string } {
  try {
    const cookieObj: { [key: string]: string } = {}
    // 分割 Cookie 字符串
    const cookieArray = cookies.split('; ')

    // 遍历每个 Cookie 键值对
    for (const cookie of cookieArray) {
      const [key, value] = cookie.split('=')
      if (key && value) {
        cookieObj[key.trim()] = decodeURIComponent(value.trim())
      }
    }

    return cookieObj
  } catch {
    return {}
  }
}
