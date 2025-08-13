<template>
  <BaseModal
    v-model:open="open"
    :width="420"
    title="Add KVM Device"
    :content-style="{ paddingBlockEnd: '0px' }"
    :before-ok="handleBeforeOk"
    @close="handleClose"
  >
    <GlForm
      v-if="open"
      ref="formRef"
      :model="formState"
      :rules="formRules"
      layout="vertical"
      label-align="left"
      hide-required-mark
      :colon="false"
      :validate-trigger="['change', 'blur']"
    >
      <FormItem label="KVM Device Name" name="name">
        <GlInput
          v-model:value="formState.name"
          :placeholder="'Enter KVM Name'"
          size="small"
          name="name"
        />
      </FormItem>
      <FormItem label="KVM Device IP" name="ip">
        <GlInput
          v-model:value="formState.ip"
          :placeholder="'Enter KVM Ip Address'"
          size="small"
          name="ip"
        />
      </FormItem>
      <FormItem label="KVM Device Password" name="password">
        <GlInput
          v-model:value="formState.password"
          :placeholder="'Enter KVM Password'"
          size="small"
          name="password"
        />
      </FormItem>
      <FormItem label="KVM Device Model" name="deviceModel">
        <GlSelect
          v-model:value="formState.deviceModel"
          :options="deviceModelSelectOptions"
          :placeholder="'Enter KVM Device Model '"
          size="small"
          name="deviceModel"
        />
      </FormItem>
    </GlForm>
  </BaseModal>
</template>

<script setup lang="ts">
import { deviceModelSelectOptions, type KvmDeviceInfo } from '@/models/kvm.model'
import { ErrorMsgHandler } from '@/tools'
import { validateIP, type FormRules, type OnBeforeOk } from '@gl/main'
import { BaseModal, GlForm, GlInput, GlSelect } from '@gl/main/components'
import { FormItem, type FormInstance } from 'ant-design-vue'
import { computed, ref } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emits = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const formRef = ref<FormInstance>()

const open = computed({
  get: () => props.open,
  set: (val: boolean) => {
    emits('update:open', val)
  }
})

const formState = ref({} as KvmDeviceInfo)

const formRules: FormRules<KvmDeviceInfo> = {
  name: [{ required: true, message: 'Please enter the KVM name' }],
  password: [{ required: true, message: 'Please enter the KVM password' }],
  ip: [
    {
      required: true,
      async validator(_, value) {
        if (!validateIP(value)) {
          throw 'Please enter the correct KVM IP'
        }
      }
    }
  ],
  deviceModel: [{ required: true, message: 'Please select the KVM model' }]
}

const handleClose = () => {
  open.value = false
  formState.value = {} as KvmDeviceInfo
}

const handleBeforeOk: OnBeforeOk = async (done) => {
  try {
    await formRef.value.validateFields()
  } catch (error) {
    done(false)
    new ErrorMsgHandler(error)
  }
}
</script>

<style lang="scss" scoped></style>
