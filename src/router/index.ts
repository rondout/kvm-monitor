/*
 * @Author: shufei.han
 * @Date: 2024-11-26 11:11:38
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-03-07 16:28:32
 * @FilePath: \gl-kvm-frontend\src\router\index.ts
 * @Description: 路由文件
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import whiteList from './whiteList'
import { getLogin } from '@/models/user.model'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '',
      component: () => import('@/views/layout/mainLayout.vue'),
      children: [
        // {
        //   path: '',
        //   component: () => import('@/views/kvm/kvmPage.vue')
        // },
        // {
        //   path: '/kvm',
        //   component: () => import('@/views/kvm/kvmPage.vue'),
        //   name: 'kvm'
        // }
      ]
    },
    {
      path: '/login',
      component: () => import('@/views/login/loginPage.vue'),
      name: 'login'
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/404/noPermissionPage.vue')
    }
  ]
})

router.beforeEach(async (to, _, next) => {
  // 初始化页面
  if (whiteList.includes(to.path)) {
    // 白名单页面直接跳转
    next()
  } else {
    // 判断是否已经获取用户信息
    if (getLogin()) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
