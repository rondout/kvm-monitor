import type { KvmDeviceInfo } from '@/models/kvm.model'
import { httpService } from './http'

export const mainService = {
  getKvmDeviceList() {
    return httpService.get<KvmDeviceInfo[]>('/api/kvm/list')
  },
  addKvmDevice(info: KvmDeviceInfo) {
    return httpService.post('/api/kvm/add', info)
  },
  connectKvm(id: string) {
    return httpService.post('/api/kvm/connect', null, { params: { id } })
  }
}
