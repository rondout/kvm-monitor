import { Axios } from 'axios'
import { access, mkdir, readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import https from 'https'
import { getAppDataPath } from 'appdata-path'

export const APP_NAME = 'KVM Monitor'

export enum KvmDeviceModel {
  RM1 = 'RM1',
  RM1PE = 'RM1PE',
  RM10 = 'RM10'
}

export interface KvmDeviceInfo {
  id?: string
  ip: string
  password: string
  deviceModel: KvmDeviceModel
  name: string
  cookie?: string
}

export const KVM_DB_DIR = resolve(getAppDataPath(), '../db')

export const KVM_DB_PATH = resolve(getAppDataPath(), '../db/kvm.json')

const agent = new https.Agent({
  rejectUnauthorized: false // 忽略证书验证
})

export interface KvmDbConstruct {
  kvmList: KvmDeviceInfo[]
  cookies: { id: string; cookies: string }[]
}

async function ensureDir(dirPath: string): Promise<void> {
  const absolutePath = resolve(dirPath)

  try {
    // 尝试访问目录（如果存在则直接返回）
    await access(absolutePath)
    console.log(`目录已存在: ${absolutePath}`)
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 递归创建目录（自动创建所有不存在的父目录）
      await mkdir(absolutePath, { recursive: true })
      console.log(`目录创建成功: ${absolutePath}`)
    } else {
      throw error // 其他错误（如权限不足）
    }
  }
}

export const initDb = async () => {
  try {
    console.log('DB Path is: ', KVM_DB_PATH)

    await ensureDir(KVM_DB_DIR)
    await access(KVM_DB_PATH)
  } catch (error) {
    await writeFile(KVM_DB_PATH, JSON.stringify({ kvmList: [], cookies: [] }))
    console.log(error)
    // return { kvmList: [], cookies: [] };
  }
}

export const getDbData = async () => {
  try {
    const res = await readFile(KVM_DB_PATH, 'utf-8')
    return JSON.parse(res) as KvmDbConstruct
  } catch (error) {
    console.log('ReadDbFileError: ', KVM_DB_PATH, error)
    return {} as KvmDbConstruct
  }
}

export const setDbData = async (data: KvmDbConstruct) => {
  try {
    await writeFile(KVM_DB_PATH, JSON.stringify(data))
    return true
  } catch (error) {
    return false
  }
}

export const getKvmDevicesFromDb = async () => {
  try {
    const db = await getDbData()

    db.kvmList = db.kvmList.map((item) => {
      item.cookie = db.cookies?.find((cookie) => cookie.id === item.id)?.cookies
      return item
    })
    return (db.kvmList || []) as KvmDeviceInfo[]
  } catch (error) {
    return []
  }
}

export const getKvmDeviceById = async (id: string) => {
  try {
    const db = await getDbData()
    return (db.kvmList || []).find((item) => item.id === id)
  } catch (error) {
    return null
  }
}

export const getCookiesById = async (id: string) => {
  try {
    const db = await getDbData()
    return (db.cookies || []).find((item) => item.id === id)?.cookies || ''
  } catch (error) {
    return ''
  }
}

export const saveCookiesToDb = async (id: string, cookies: string) => {
  try {
    const db = await getDbData()
    const cookiesList = db.cookies || []
    const index = cookiesList.findIndex((item) => item.id === id)
    if (index > -1) {
      cookiesList[index].cookies = cookies
    } else {
      cookiesList.push({
        id,
        cookies
      })
    }
    await setDbData({ ...db, cookies: cookiesList })
    console.log('Save Cookies Success')
  } catch (error) {
    console.log('Save Cookies Error')
  }
}

export const saveKvmDevicesToDb = async (data: KvmDeviceInfo) => {
  try {
    // if(!stat(KVM_DB_PATH))
    const db = await getDbData()
    const res = await setDbData({
      ...db,
      kvmList: [...(db.kvmList || []), data]
    })
    return res
  } catch (error) {
    console.log('Save Kvm Error: ', error)
    return false
  }
}

export const deleteKvmDevicesFromDb = async (id: string) => {
  try {
    const db = await getDbData()
    const res = await setDbData({
      ...db,
      kvmList: db.kvmList.filter((item) => item.id !== id),
      cookies: db.cookies.filter((item) => item.id !== id)
    })
    return res
  } catch (error) {
    console.log('Delete Kvm Error: ', error?.toString?.())
    return false
  }
}

export class KvmDeviceConnector {
  public kvm: KvmDeviceInfo = null

  static LoginUser = 'admin'

  constructor(
    private id: string,
    private onConnect?: (success: boolean) => void
  ) {
    this.init()
  }

  private axios = new Axios()
  private cookies = ''

  private async init() {
    this.kvm = await getKvmDeviceById(this.id)
    console.log('Init Kvm Device: ', this.id, this.kvm)
    const cookies = await getCookiesById(this.id)
    this.cookies = cookies
    this.configAxios()
    const res = await this.connect()
    this.onConnect?.(res)
  }

  private genUrl(url: string) {
    return `https://${this.kvm.ip}/api` + url
  }

  private configAxios() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this
    this.axios.defaults.timeout = 10000
    this.axios.interceptors.request.use((config) => {
      console.log('config: ', config.headers.Cookie, that.cookies)

      config.headers.Cookie = that.cookies
      return config
    })
  }

  private async checkAuth() {
    try {
      console.log('Check auth: ', this.kvm, this.id)
      const res = await this.axios.get(this.genUrl('/auth/check'), {
        httpsAgent: agent
      })
      const data = JSON.parse(res.data)
      if (data.ok) {
        console.log('Check auth success', res.data)
        return true
      }
      console.log('Check auth UnAuthorized')
      return false
    } catch (error) {
      console.log('Check auth error')
      return false
    }
  }

  public async connect() {
    const res = await this.checkAuth()
    if (res) {
      return true
    } else {
      const loginSuccess = await this.loginKvm()
      console.log('loginSuccess', loginSuccess)
      if (loginSuccess) {
        return await this.checkAuth()
      }
      return false
    }
  }

  private async loginKvm() {
    const password = this.kvm.password
    try {
      const data = new FormData()
      data.append('user', KvmDeviceConnector.LoginUser)
      data.append('passwd', password)
      console.log('Login Kvm: ', this.kvm.ip, this.genUrl('/auth/login'), data)
      const res = await this.axios.post(this.genUrl('/auth/login'), data, {
        httpsAgent: agent,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('Login Kvm result: ')
      this.cookies = res.headers['set-cookie'][0]?.split(';')[0] || ''
      console.log('Login Kvm Success: ', this.id, this.cookies)
      await saveCookiesToDb(this.id, this.cookies)
      return true
    } catch (error) {
      console.log('Login Kvm Error: ', error?.toString?.())
      return false
    }
  }

  // public connectWs() {
  //     const ip = this.kvm.ip
  //     console.log('connectWs', ip);
  //     app.use(`/api/ws/${ip}`, createProxyMiddleware({
  //         target: `wss://${ip}/api/ws`,
  //         changeOrigin: true,
  //         ws: true,
  //         secure: false,
  //         headers: { Cookie: this.cookies }
  //     }));
  // }
}

export const connectKvm = (id: string) => {
  return new Promise((resolve, reject) => {
    new KvmDeviceConnector(id, (res) => {
      // instance.connectWs()
      console.log('Connect KVM Result: ', res)
      if (res) {
        resolve(res)
      } else {
        reject()
      }
    })
  })
  // const res = await instance.connect()
}
