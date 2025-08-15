/*
 * @Author: shufei.han
 * @Date: 2025-03-06 14:58:18
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-08-11 14:26:09
 * @FilePath: \gl-kvm-frontend\src\hooks\useBase64Image.ts
 * @Description: 获取base64图片
 */
import { reactive } from 'vue'
import loginBgLight from '@renderer/assets/images/login-bg-light.png'
import loginBgDark from '@renderer/assets/images/login-bg-dark.png'
import remotePlanet from '@renderer/assets/svg/access-remote-planet.svg'
import remotePlanetDark from '@renderer/assets/images/access-remote-planet-dark.png'
import remoteAstronaut from '@renderer/assets/svg/access-remote-astronaut.svg'
import bindCode from '@renderer/assets/images/cloud/bind-code.png'
import bindCodeZh from '@renderer/assets/images/cloud/bind-code-zh.png'

export enum UseBase64Images {
  LOGIN_BG = 'login_bg',
  LOGIN_BG_DARK = 'login_bg_dark',
  REMOTE_ASTRONAUT = 'remote_astronaut',
  REMOTE_PLANET = 'remote_planet',
  REMOTE_PLANET_DARK = 'remote_planet_dark',
  BIND_CODE = 'bind_code',
  BIND_CODE_ZH = 'bind_code_zh'
}

export const Base64ImageMap = new Map([
  [UseBase64Images.LOGIN_BG, loginBgLight],
  [UseBase64Images.LOGIN_BG_DARK, loginBgDark],
  [UseBase64Images.REMOTE_ASTRONAUT, remoteAstronaut],
  [UseBase64Images.REMOTE_PLANET, remotePlanet],
  [UseBase64Images.REMOTE_PLANET_DARK, remotePlanetDark],
  [UseBase64Images.BIND_CODE, bindCode],
  [UseBase64Images.BIND_CODE_ZH, bindCodeZh]
])
/** 判断是否是base64图片 */
export const isValidBase64Image = (base64: string) => {
  if (!base64) return false
  return base64.startsWith('data:image/')
}
/** 将图片转成base64 */
export function loadImageAndTRansferToBase64(imgSrc: string) {
  const image = new Image()
  image.src = imgSrc

  return new Promise<string>((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0)
        const base64 = canvas.toDataURL('image/png')
        resolve(base64)
      } else {
        reject()
      }
    }
    image.onerror = () => {
      reject()
    }
  })
}
/** 使用base64图片（基于localStorage） */
export function useBase64Image(type: UseBase64Images) {
  const imgSrc = Base64ImageMap.get(type)

  const data = reactive<{ src: string; finished: boolean }>({
    src: null as string,
    finished: false
  })

  const getImage = async () => {
    const base64 = localStorage.getItem(type)
    if (isValidBase64Image(base64)) {
      data.src = base64
      data.finished = true
    }
    try {
      const base64 = await loadImageAndTRansferToBase64(imgSrc)
      setImageToStorage(base64)
      data.src = base64
    } catch {
      data.src = imgSrc
    }

    data.finished = true
  }

  const setImageToStorage = (base64Data: string) => {
    if (isValidBase64Image(base64Data)) {
      localStorage.setItem(type, base64Data)
    }
  }

  getImage()

  return { data, getImage, setImageToStorage }
}
