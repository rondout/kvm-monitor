<template>
  <div class="kvm-content full-height">
    <BaseText type="large-title-m" center class="text-primary">Welcome to KVM Monitor</BaseText>
    <div class="flex" style="margin-top: 16px">
      <BaseNoData v-if="!props.kvmList?.length" />
      <div v-else class="content">
        <BaseRow :gutter="0" :count-per-line="countPerline" :items="props.kvmList">
          <template #default="{ data }">
            <KvmDevicePlayer :kvm="data" />
          </template>
        </BaseRow>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KvmDeviceInfo } from '@renderer/models/kvm.model'
import { BaseNoData, BaseText } from '@gl/main/components'
import KvmDevicePlayer from '../kvm/kvmDevicePlayer.vue'
import BaseRow from '@renderer/components/baseRow.vue'
import { computed } from 'vue'
import { useWindowSize } from '@gl/main'

const { width } = useWindowSize()

const props = defineProps<{
  kvmList: KvmDeviceInfo[]
}>()

const countPerline = computed(() => {
  if (width.value >= 1364) {
    return 2
  }
  return 1
})
</script>

<style lang="scss" scoped>
.player-container {
  width: 960px;
}
</style>
