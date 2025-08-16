<template>
  <div class="kvm-list">
    <div class="flex title">
      <BaseText variant="level2" type="body-m" class="text-primary">KVM Devices</BaseText>
    </div>
    <BaseDivider horizontal />
    <div v-if="!state.kvmList?.length">
      <BaseNoData />
    </div>
    <div v-else class="list-container">
      <KvmListItem
        v-for="kvm in state.kvmList"
        :key="kvm.id"
        :kvm="kvm"
        @delete="removeKvm(kvm)"
        @click="handleConnect(kvm)"
      />
    </div>
    <div class="flex">
      <BaseButton primary @click="state.addOpen = true">Click to Add KVM</BaseButton>
    </div>
    <div class="flex">
      <!-- <BaseButton primary @click="initApiWsMsgs">Init Api Ws</BaseButton> -->
    </div>
  </div>
  <AddKvmModal v-model:open="state.addOpen" @success="getKvmDeviceList" />
</template>

<script setup lang="ts">
import { BaseButton, BaseDivider, BaseNoData, BaseText } from '@gl/main/components'
import AddKvmModal from '../kvm/addKvmModal.vue'
import { reactive } from 'vue'
import { mainService } from '@renderer/api/main'
import type { KvmDeviceInfo } from '@renderer/models/kvm.model'
import { ErrorMsgHandler } from '@renderer/tools'
import KvmListItem from '../kvm/kvmListItem.vue'
import { glConfirm } from '@gl/main'

const state = reactive({
  addOpen: false,
  kvmList: [] as KvmDeviceInfo[]
})

const emits = defineEmits<{ (e: 'addToPage', kvm: KvmDeviceInfo); (e: 'remove', id: string) }>()

const getKvmDeviceList = async () => {
  try {
    const res = await mainService.getKvmDeviceList()
    console.log(res)
    state.kvmList = res.info
  } catch (error) {
    new ErrorMsgHandler(error, 'Get Kvm Device List Failed')
  }
}

getKvmDeviceList()

const removeKvm = async (device: KvmDeviceInfo) => {
  glConfirm({
    content: `Are sure to remove this device ${device.name}?`,
    async onOk() {
      await mainService.deleteKvmDevice(device.id)
      getKvmDeviceList()
      emits('remove', device.id)
    }
  })
}

const handleConnect = async (kvm: KvmDeviceInfo) => {
  try {
    await mainService.connectKvm(kvm.id)
    emits('addToPage', kvm)
  } catch (error) {
    //
  }
}
</script>

<style lang="scss" scoped>
.title {
  padding: 16px;
  padding-bottom: 8px;
}

.list-container {
  padding: 8px 16px;
}
</style>
