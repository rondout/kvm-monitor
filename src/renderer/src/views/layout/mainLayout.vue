<template>
  <div class="main-layout full-height">
    <div class="header bg-primary flex-btw">
      <BaseText variant="level1" type="head-r">Gl KVM Monitor</BaseText>
      <div class="flex">
        <Tooltip title="Logout">
          <GlSvg :size="24" class="pointer" name="gl-kvm-logout" @click="logout" />
        </Tooltip>
      </div>
    </div>
    <div class="content flex-start flex-nowrap">
      <div class="content-left">
        <LayoutKvmList @remove="removeKvm" @add-to-page="handleConnectDevice" />
      </div>
      <div class="content-right flex-1">
        <LayoutKvmContent :kvm-list="state.kvmList" />
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
import { glConfirm } from '@gl/main'
import { removeLogin } from '@renderer/models/user.model'
import { useRouter } from 'vue-router'

const router = useRouter()

const state = reactive({
  kvmList: [] as KvmDeviceInfo[]
})

const removeKvm = async (id: string) => {
  state.kvmList = state.kvmList.filter((item) => item.id !== id)
}

const handleConnectDevice = (device: KvmDeviceInfo) => {
  if (state.kvmList.find((item) => item.id === device.id)) {
    return
  }
  state.kvmList.push(device)
}

const logout = () => {
  glConfirm({
    title: 'Logout',
    content: 'Are you sure you want to logout?',
    onOk() {
      removeLogin()
      router.push('/login')
    }
  })
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
    min-width: 240px;
    height: 100%;
    box-sizing: border-box;
    border-right: 1px solid var(--gl-color-line-divider1);
  }

  .content-right {
    padding: 16px;
    height: 100%;
    background-color: #fff;
    overflow: auto;
  }
}
</style>
