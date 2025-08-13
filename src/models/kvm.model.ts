import { SelectOptions, type BaseData } from '@gl/main'

export enum KvmDeviceModel {
  RM1 = 'RM1',
  RM1PE = 'RM1PE',
  RM10 = 'RM10'
}

export const deviceModelSelectOptions = [
  new SelectOptions(KvmDeviceModel.RM1, 'RM1'),
  new SelectOptions(KvmDeviceModel.RM1PE, 'RM1PE'),
  new SelectOptions(KvmDeviceModel.RM10, 'RM10')
]

export interface KvmDeviceInfo extends BaseData {
  ip: string
  password: string
  deviceModel: KvmDeviceModel
  name: string
}
