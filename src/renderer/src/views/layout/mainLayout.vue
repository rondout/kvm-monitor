<template>
  <div class="main-layout full-height">
    <div class="header bg-primary flex-btw">
      <BaseText variant="level1" type="head-r">Gl KVM Monitor</BaseText>
      <div class="flex">
        <Tooltip title="Logout">
          <GlSvg :size="24" class="pointer" name="gl-kvm-logout" />
        </Tooltip>
      </div>
    </div>
    <div class="content flex">
      <div class="content-left">
        <LayoutKvmList @add-to-page="handleConnectDevice" />
      </div>
      <div class="content-right flex-1">
        <LayoutKvmContent :kvmList="state.kvmList" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseText, GlSvg } from '@gl/main/components'
import { Tooltip } from 'ant-design-vue'
import LayoutKvmList from './layoutKvmList.vue'
import LayoutKvmContent from './layoutKvmContent.vue'
import { reactive } from 'vue'
import type { KvmDeviceInfo } from '@renderer/models/kvm.model'

const state = reactive({
  kvmList: [] as KvmDeviceInfo[],
})

const handleConnectDevice = (device: KvmDeviceInfo) => {
  if (state.kvmList.find(item => item.id === device.id)) {
    return
  }
  state.kvmList.push(device)
}


</script>

<style lang="scss" scoped>
.header {
  padding: 0 24px;
  height: 48px;
}
.content {
  height: calc(100% - 48px);
  .content-left {
    width: 240px;
    height: 100%;
    box-sizing: border-box;
    border-right: 1px solid var(--gl-color-line-divider1);
  }
  .content-right {
    padding: 16px;
    height: 100%;
    background-color: #fff;
  }
}
</style>
