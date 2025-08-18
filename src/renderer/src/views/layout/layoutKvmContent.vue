<template>
  <div ref="contentRef" class="kvm-content full-height">
    <div class="flex-btw">
      <BaseText type="large-title-m" center class="text-primary">Welcome to KVM Monitor</BaseText>
      <div class="flex">
        <BaseIconButton style="margin-left: 12px" icon="" @click="requestFullscreen">
          <GlSvg name="gl-kvm-fullscreen" />
        </BaseIconButton>
        <BaseIconButton style="margin-left: 12px" icon="" @click="handleDrag">
          <GlSvg name="gl-kvm-drag" />
        </BaseIconButton>
      </div>
    </div>
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
import { BaseIconButton, BaseNoData, BaseText, GlSvg } from '@gl/main/components'
import KvmDevicePlayer from '../kvm/kvmDevicePlayer.vue'
import BaseRow from '@renderer/components/baseRow.vue'
import { computed, reactive, ref } from 'vue'
import { useWindowSize } from '@gl/main'

const { width } = useWindowSize()
const contentRef = ref<HTMLDivElement>()

const props = defineProps<{
  kvmList: KvmDeviceInfo[]
}>()

const state = reactive({
  dragMode: false
})

const countPerline = computed(() => {
  if (width.value >= 1364) {
    return 2
  }
  return 1
})

const requestFullscreen = () => {
  contentRef.value.requestFullscreen()
}

const handleDrag = () => {
  state.dragMode = true
}
</script>

<style lang="scss" scoped>
.player-container {
  width: 960px;
}
</style>
