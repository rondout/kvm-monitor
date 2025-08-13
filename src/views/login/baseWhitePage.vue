<!--
 * @Author: shufei.han
 * @Date: 2024-11-26 11:11:38
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-24 17:45:26
 * @FilePath: \gl-kvm-frontend\src\views\login\baseWhitePage.vue
 * @Description: 登录页面
-->

<template>
  <div :class="{ 'container flex full-height': true, 'dark-mode': appStore.isDarkMode }">
    <div class="content flex flex-1 full-width">
      <div v-if="data.finished" class="white-page-container bg-default" :style="containerStyle">
        <div class="white-page-content full-height">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBase64Image, UseBase64Images } from '@/hooks/useBase64Image'
import { useGlobalStore } from '@/stores'

const { appStore } = useGlobalStore()

const { data } = useBase64Image(
  appStore.isDarkMode ? UseBase64Images.LOGIN_BG_DARK : UseBase64Images.LOGIN_BG
)

const containerStyle = computed(() => {
  return {
    backgroundImage: `url(${data.src})`
  }
})
</script>

<style lang="scss" scoped>
.container {
  background: var(--gl-color-bg-page);
  overflow: auto;
  flex-direction: column;
  justify-content: flex-start;
  .content {
    padding: 24px 0;
  }
  .white-page-container {
    background-repeat: no-repeat;
    background-position: left;
    background-size: contain;
    // height: 100%;
    width: 970px;
    height: 600px;
    position: relative;
    border-radius: 20px;
    .kvm-login-logo {
      position: absolute;
      top: 32%;
      left: 3%;
      width: 12%;
      display: none;
    }

    .white-page-content {
      position: absolute;
      right: 0;
      overflow: auto;
      width: 50%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  }
}

@media screen and (max-width: 1080px) {
  .container {
    .white-page-container {
      background-image: none !important;
      width: calc(100% - 24px);
      .white-page-content {
        width: 100%;
      }
      .kvm-login-logo {
        display: none;
      }
    }
  }
}
</style>
