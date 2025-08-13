import { createPinia } from 'pinia'
import { useAppStore } from './app'

const store = createPinia()

export default store
/** 全局状态管理（为了避免各种store引用） */
export const useGlobalStore = () => {
  return {
    appStore: useAppStore()
  }
}
