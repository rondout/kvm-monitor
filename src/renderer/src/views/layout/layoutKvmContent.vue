<template>
  <div class="kvm-content">
    <div class="flex full-height">
      <BaseNoData v-if="!props.kvmList?.length" />
      <div class="content" v-else>
        <KvmDevicePlayer v-for="kvm in props.kvmList" :key="kvm.id" :kvm="kvm" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KvmDeviceInfo } from '@renderer/models/kvm.model';
import { BaseNoData } from '@gl/main/components'
import KvmDevicePlayer from '../kvm/kvmDevicePlayer.vue';

const props = defineProps<{
  kvmList: KvmDeviceInfo[];
}>();

</script>

<style lang="scss" scoped></style>
