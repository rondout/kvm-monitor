<template>
  <GlConfigProvider
    :t="t"
    :locale="Languages.ZH"
    :theme-mode="appStore.themeMode"
    :ant-config-provider-props="{ theme: themeConfig }"
  >
    <ConfigProvider :theme="themeConfig">
      <router-view />
    </ConfigProvider>
  </GlConfigProvider>
</template>

<script setup lang="ts">
import { ConfigProvider as GlConfigProvider } from '@gl/main/components'
import { computed } from 'vue'
import { useGlobalStore } from './stores'
import { ConfigProvider } from 'ant-design-vue'
import { Languages } from '@gl/main'

const { appStore } = useGlobalStore()

const themeConfig = computed(() => {
  return { token: appStore.antdTheme }
})

const t = (text: string) => text
</script>

<style lang="scss">
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
