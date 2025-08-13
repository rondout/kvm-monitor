/*
 * @Author: shufei.han
 * @Date: 2025-01-06 17:34:49
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-23 09:23:48
 * @FilePath: \gl-kvm-frontend\src\stores\modules\app.ts
 * @Description: app配置
 */

import { defineStore } from 'pinia'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { computed, ref, watch } from 'vue'
import {
  baseTheme,
  createStyleInsert,
  darkTheme,
  LocalStorageKeys,
  replaceAntTheme,
  ThemeMode,
  useLocalStorage
} from '@gl/main'

export const useAppStore = defineStore('appGlobal', () => {
  const { getValue, setValue } = useLocalStorage(LocalStorageKeys.THEME_MODE_KEY, ThemeMode.LIGHT)
  const themeMode = ref<ThemeMode>(getValue())
  /** 获取主题模式 */
  const themeConfig = computed(() => {
    if (isDarkMode.value) {
      return darkTheme
    }
    return baseTheme
  })
  /** 判断是否是暗黑模式 */
  const isDarkMode = computed(() => {
    // UI设计：全屏模式下就直接用深色模式
    return themeMode.value === ThemeMode.DARK
  })
  /** 设置主题变量到页面 */
  const setThemeVarsToDocument = () => {
    createStyleInsert(themeConfig.value)
  }

  /** 获取antd 主题配置 */
  const antdTheme = computed<ThemeConfig['token']>(() => replaceAntTheme(themeConfig.value.content))
  /** 设置主题 */
  const setThemeMode = (theme: ThemeMode) => {
    themeMode.value = theme
    setValue(theme)
  }

  watch(
    () => themeMode.value,
    () => {
      // 改变主题的时候就设置主题变量到页面
      setThemeVarsToDocument()
    },
    {
      immediate: true
    }
  )

  return { themeMode, antdTheme, isDarkMode, setThemeMode, setThemeVarsToDocument }
})
