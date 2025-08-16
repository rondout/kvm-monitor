<template>
  <div
    class="list-item pointer bg-primary"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="inner flex-btw">
      <BaseText>{{ kvm.name }}</BaseText>
      <BaseIconButton v-if="hovered" icon="delete" @click.stop="removeKvm">
        <GlSvg name="gl-kvm-delete" />
      </BaseIconButton>
      <BaseTag v-else>{{ kvm.deviceModel }}</BaseTag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BaseIconButton, BaseTag, BaseText, GlSvg } from '@gl/main/components'
import { KvmDeviceInfo } from '@renderer/models/kvm.model'
import { ref } from 'vue'

defineProps<{
  kvm: KvmDeviceInfo
}>()

const emit = defineEmits<{
  (e: 'delete'): void
}>()

const removeKvm = () => {
  emit('delete')
}

const hovered = ref(false)
</script>

<style lang="scss" scoped>
.list-item {
  margin-bottom: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  .inner {
    height: 32px;
  }
}
</style>
