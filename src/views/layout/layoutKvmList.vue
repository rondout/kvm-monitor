<template>
  <div class="kvm-list">
    <div class="flex title">
      <BaseText variant="level2" type="body-m" class="text-primary">KVM Devices</BaseText>
    </div>
    <BaseDivider horizontal />
    <div>
      <BaseNoData />
      <div class="flex">
        <BaseButton primary @click="state.addOpen = true">Click to Add KVM</BaseButton>
      </div>
    </div>
  </div>
  <AddKvmModal v-model:open="state.addOpen" />
</template>

<script setup lang="ts">
import { BaseButton, BaseDivider, BaseNoData, BaseText } from '@gl/main/components'
import AddKvmModal from '../kvm/addKvmModal.vue'
import { reactive } from 'vue'
import { mainService } from '@/api/main'
import type { KvmDeviceInfo } from '@/models/kvm.model'
import { ErrorMsgHandler } from '@/tools'

const state = reactive({
  addOpen: false,
  kvmList: [] as KvmDeviceInfo[]
})

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
</script>

<style lang="scss" scoped>
.title {
  padding: 16px;
  padding-bottom: 8px;
}
</style>
