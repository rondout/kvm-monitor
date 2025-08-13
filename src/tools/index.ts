import { message } from 'ant-design-vue'
import type { ValidateErrorEntity } from 'ant-design-vue/es/form/interface'
import type { AxiosError } from 'axios'

declare global {
  const log: typeof console.log
  interface Window {
    log: typeof console.log
  }
}

export function registerLogFunction() {
  if (import.meta.env.VITE_MODE_ENV === 'production') {
    window.log = () => {}
    console.log = () => {}
  } else {
    window.log = console.log
  }
}

/** 统一处理后端返回的错误 */
export class ErrorMsgHandler {
  /** 是否从服务器返回的信息中解析出错误信息并在页面提示 */
  public hasError: boolean
  constructor(
    private error: unknown,
    private errMsg?: string
  ) {
    this.hasError = this.showError() || this.showFormError()
    if (!this.hasError && this.errMsg) {
      message.error(this.errMsg)
    }
  }
  /**
   * @description 使用message.error提示错误信息到页面
   * @returns 是否从服务器返回的信息中解析出错误信息并在页面提示
   */
  private showError() {
    try {
      const { error_msg } = (<AxiosError<{ result: { error_msg: string } }>>this.error).response
        .data.result
      message.error(error_msg)
      return true
    } catch {
      return false
    }
  }
  /**
   * @description 显示antd的表单验证的错误信息
   * @returns 显示表单验证错误
   */
  private showFormError() {
    try {
      const error = (this.error as ValidateErrorEntity)?.errorFields?.[0]?.errors?.[0]
      if (error) {
        message.error(error)
        return true
      }
      return false
    } catch {
      return false
    }
  }
}
