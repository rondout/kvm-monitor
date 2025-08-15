import { createApp } from 'vue'
import App from './App.vue'
import { registerLogFunction } from './tools'
import '@gl/main/style.css'
import store from './stores'
import '@renderer/assets/iconfont/iconfont.js'
import router from './router'
import '@renderer/assets/main.scss'

registerLogFunction()
createApp(App).use(store).use(router).mount('#app')
