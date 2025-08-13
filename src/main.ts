import { createApp } from 'vue'
import App from './App.vue'
import { registerLogFunction } from './tools'
import '@gl/main/style.css'
import store from './stores'
import '@/assets/iconfont/iconfont.js'
import router from './router'
import '@/assets/main.scss'

registerLogFunction()
createApp(App).use(store).use(router).mount('#app')
