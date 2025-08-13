import { Axios } from 'axios';
import { KvmDeviceInfo } from './../../src/models/kvm.model';
import { readFile, stat, writeFile } from 'fs/promises';
import { nanoid } from 'nanoid';
import { resolve } from 'path';
import https from 'https'; 

export const KVM_DB_PATH = resolve(__dirname, '../db/kvm.json')

const agent = new https.Agent({  
  rejectUnauthorized: false // 忽略证书验证
});

export interface KvmDbConstruct {
    kvmList: KvmDeviceInfo[];
    cookies: {id: string, cookies: string}[]
}

export const getDbData = async () => { 
    try {
        const res = await readFile(KVM_DB_PATH, 'utf-8')
        return (JSON.parse(res)) as KvmDbConstruct
    } catch (error) {
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

export const getKvmAppsFromDb = async () => { 
    try {
        const db = await getDbData()
        return (db.kvmList || []) as KvmDeviceInfo[]
    } catch (error) {
        return []
    }
}

export const getKvmDeviceById = async (id: string) => {
    try {
        const db = await getDbData()
        return (db.kvmList || []).find(item => item.id === id)
    } catch (error) {
        return null
    }
}

export const getCookiesById = async (id: string) => {
    try {
        const db = await getDbData()
        return (db.cookies || []).find(item => item.id === id)?.cookies || ''
    } catch (error) {
        return ''
    }
}

export const saveCookiesToDb = async (id: string, cookies: string) => {
    try {
        const db = await getDbData()
        const cookiesList = db.cookies || []
        const index = cookiesList.findIndex(item => item.id === id)
        if (index > -1) {
            cookiesList[index].cookies = cookies    
        } else {
            cookiesList.push({
                id,
                cookies
            })
        }  
        await setDbData({...db, cookies: cookiesList })
        console.log('Save Cookies Success');
    }
    catch (error) {
        console.log('Save Cookies Error');
    }
}

export const saveKvmAppsToDb = async (data: KvmDeviceInfo) => {
    try {
        // if(!stat(KVM_DB_PATH))
        const db = await getDbData()
        const res = await setDbData({...db, kvmList: [...(db.kvmList || []), {...data, id: nanoid()}]})
        return res
    } catch (error) {
        console.log('Save Kvm Error: ', error);
        return false
    }
}

export class KvmDeviceConnector {
    public kvm: KvmDeviceInfo = null

    static LoginUser = 'admin'

    constructor(private id: string, private onConnect?: (success: boolean) => void) {
        this.init()
    }

    
    private axios = new Axios()
    private cookies = ''
    
    
    private async init() {
        this.kvm = await getKvmDeviceById(this.id)
        console.log('Init Kvm Device: ', this.id, this.kvm);
        const cookies = await getCookiesById(this.id)
        this.cookies = cookies
        this.configAxios()
        const res = await this.connect()    
        this.onConnect?.(res)    
    }
    
    private genUrl (url: string) {
        return `https://${this.kvm.ip}/api` + url
    }
    

    private configAxios() {
        const that = this
        this.axios.interceptors.request.use(config => {
            console.log('config: ', config.headers.Cookie, that.cookies);
            
            config.headers.Cookie = that.cookies
            return config
        })
    }

    private async checkAuth() { 
        try {
            console.log('Check auth: ', this.kvm, this.id);
            const res = await this.axios.get(this.genUrl('/auth/check'), { httpsAgent: agent })
            console.log('Check auth success', res.data);
            return true
        } catch (error) {
            console.log('Check auth error');
            return false
        }
    }

    public async connect() {
            const res = await this.checkAuth()
            if(res) {
                return true
            }else {
                const loginSuccess = await this.loginKvm()
                console.log('loginSuccess', loginSuccess);
                if(loginSuccess) {
                    return await this.checkAuth()
                }
                return false
            }
    }

    private async loginKvm() {
        const password = this.kvm.password
        try {
            console.log('Login Kvm: ', this.kvm.ip, this.genUrl('/auth/login'));
            const res = await this.axios.post(this.genUrl('/auth/login'), { user: KvmDeviceConnector.LoginUser, passwd:password }, {httpsAgent: agent, headers: {
                'Content-Type': 'multipart/form-data'
            } })
            this.cookies = res.headers['set-cookie'][0]?.split(';')[0] || ''
            console.log('Login Kvm Success: ', this.id, this.cookies);
            await saveCookiesToDb(this.id, this.cookies)
            return true
        } catch (error) {
            console.log('Login Kvm Error: ', error);
            return false
        }    
    }
}

export const connectKvm = (id: string) => {
    return new Promise(async (resolve, reject) => { 
        const instance = new KvmDeviceConnector(id, res => {
            resolve(res)
        })
    })
        // const res = await instance.connect() 
}