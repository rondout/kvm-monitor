<template>
  <div class="kvm-list">
    <div class="flex title">
      <BaseText variant="level2" type="body-m" class="text-primary">KVM Devices</BaseText>
    </div>
    <BaseDivider horizontal />
    <div v-if="!state.kvmList?.length">
      <BaseNoData />
    </div>
    <div class="list-container" v-else>
      <div class="list-item bg-primary" @click="handleConnect(kvm)" v-for="kvm in state.kvmList" :key="kvm.id">
        <div class="inner flex-btw">
          <BaseText>{{ kvm.name }}</BaseText>
          <BaseTag>{{ kvm.deviceModel }}</BaseTag>
        </div>
      </div>
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
import { BaseButton, BaseDivider, BaseNoData, BaseTag, BaseText } from '@gl/main/components'
import AddKvmModal from '../kvm/addKvmModal.vue'
import { reactive } from 'vue'
import { mainService } from '@/api/main'
import type { KvmDeviceInfo } from '@/models/kvm.model'
import { ErrorMsgHandler } from '@/tools'

const state = reactive({
  addOpen: false,
  kvmList: [] as KvmDeviceInfo[]
})

const emits = defineEmits<{  (e: 'addToPage', kvm: KvmDeviceInfo) }>()

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

const handleConnect = async (kvm: KvmDeviceInfo) => {
  try {
    await mainService.connectKvm(kvm.id)
    emits('addToPage', kvm)
  } catch (error) {

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

  .list-item {
    margin-bottom: 8px;
    padding: 8px 16px;
    border-radius: 4px;
    // .inner {
    // }
  }
}
</style>
