import type { KvmDeviceInfo } from '@renderer/models/kvm.model'
import { httpService } from './http'

export const mainService = {
  login(id: string) {
    const data = new FormData()
    data.append('user', 'admin')
    data.append('passwd', 'admin')
    return httpService.get(`/kvm-api/${id}/api/upgrade/version`)
    // return httpService.post('/api/auth/login', data)
  },
  getKvmDeviceList() {
    return httpService.get<KvmDeviceInfo[]>('/api/kvm/list')
  },
  addKvmDevice(info: KvmDeviceInfo) {
    return httpService.post('/api/kvm/add', info)
  },
  deleteKvmDevice(id: string) {
    return httpService.delete(`/api/kvm/delete/${id}`)
  },  
  connectKvm(id: string) {
    return httpService.post('/api/kvm/connect', null, { params: { id } })
  }
}
