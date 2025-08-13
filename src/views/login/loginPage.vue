<!--
 * @Author: shufei.han
 * @Date: 2024-11-26 11:11:38
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-05-27 10:07:34
 * @FilePath: \gl-kvm-frontend\src\views\login\loginPage.vue
 * @Description: 登录页面
-->

<template>
  <BaseWhitePage>
    <div class="auth-form-container">
      <div class="login-form">
        <div class="title-container">
          <img :src="logoSrc" width="64" alt="" />
          <div class="title">Admin Password</div>
        </div>
        <Form
          ref="formRef"
          style="width: 360px"
          :validate-trigger="['change', 'blur']"
          class="dense-form"
          label-align="left"
          :colon="false"
          :rules="formRules"
          :model="formState"
          hide-required-mark
          @validate="handleValidate"
        >
          <FormItem name="passwd">
            <GlPassword
              v-model:value="formState.passwd"
              :placeholder="'Enter Password'"
              :use-default-validate-rule="false"
              size="small"
              name="passwd"
              @press-enter="handleSubmit"
            />
          </FormItem>
        </Form>
        <Button size="large" class="operation-btn full-width" shape="round" type="primary"
          >Log In</Button
        >
      </div>
    </div>
  </BaseWhitePage>
</template>

<script setup lang="ts">
import { Button, Form, FormItem, message, type FormInstance } from 'ant-design-vue'
import { computed, reactive, ref } from 'vue'
import { GlPassword } from '@gl/main/components'
import BaseWhitePage from './baseWhitePage.vue'
import logoSrc from '@/assets/svg/logo-primary.svg'
import { useValidateInfo, type FormRules } from '@gl/main'
import { setLogin, type LoginParams } from '@/models/user.model'
import { useRouter } from 'vue-router'

const formRef = ref<FormInstance>()
const { handleValidate } = useValidateInfo()
const router = useRouter()

const formState = reactive<LoginParams>({
  user: '',
  passwd: ''
})

/** 表单验证规则 */
const formRules = computed(() => {
  const rule: FormRules<LoginParams> = {
    user: [{ required: true, message: 'Please enter your username' }],
    passwd: [
      { required: true, message: 'Please enter your password' },
      { min: 5, max: 63, message: 'Password must be between 5 and 63 characters' }
    ]
  }
  return rule
})

const handleSubmit = () => {
  formRef.value?.validate().then(() => {
    // 登录逻辑
    if (formState.passwd === 'admin') {
      setLogin()
      router.push('/')
    } else {
      message.error('Incorrect password')
    }
  })
}
</script>

<style lang="scss" scoped>
.auth-form-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 16px 0;
  padding-bottom: 50px;
  .login-form {
    .title-container {
      text-align: center;
      .title {
        font-size: 20px;
        line-height: 28px;
        font-weight: 500;
        margin-top: 32px;
      }
      margin-bottom: 24px;
    }
    .operation-btn {
      margin: 4px 0 32px;
    }
    .forget {
      text-align: center;
      color: var(--gl-color-text-level3);
    }
  }
}

@media screen and (max-width: 380px) {
  .auth-form-container {
    padding: 20px;
    .login-form {
      width: 100%;
    }
  }
}
</style>
