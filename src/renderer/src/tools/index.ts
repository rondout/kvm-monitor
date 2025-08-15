import { message } from "ant-design-vue";
import type { ValidateErrorEntity } from "ant-design-vue/es/form/interface";
import type { AxiosError } from "axios";

declare global {
  const log: typeof console.log;
  interface Window {
    log: typeof console.log;
  }
}

export function registerLogFunction() {
  if (import.meta.env.VITE_MODE_ENV === "production") {
    window.log = () => {};
    console.log = () => {};
  } else {
    window.log = console.log;
  }
}

/** 统一处理后端返回的错误 */
export class ErrorMsgHandler {
  /** 是否从服务器返回的信息中解析出错误信息并在页面提示 */
  public hasError: boolean;
  constructor(private error: unknown, private errMsg?: string) {
    this.hasError = this.showError() || this.showFormError();
    if (!this.hasError && this.errMsg) {
      message.error(this.errMsg);
    }
  }
  /**
   * @description 使用message.error提示错误信息到页面
   * @returns 是否从服务器返回的信息中解析出错误信息并在页面提示
   */
  private showError() {
    try {
      const { msg } = (<AxiosError<{ msg: string }>>this.error).response.data;
      message.error(msg);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * @description 显示antd的表单验证的错误信息
   * @returns 显示表单验证错误
   */
  private showFormError() {
    try {
      const error = (this.error as ValidateErrorEntity)?.errorFields?.[0]
        ?.errors?.[0];
      if (error) {
        message.error(error);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

class BrowserDetector {
  public is_opera: boolean;
  public is_firefox: boolean;
  public is_safari: boolean;
  public is_chrome: boolean;
  public is_blink: boolean;
  public is_mac: boolean;
  public is_win: boolean;
  public is_ios: boolean;
  public is_android: boolean;
  public is_mobile: boolean;

  constructor() {
    // Opera 8.0+
    this.is_opera =
      // @ts-ignore
      (!!window.opr && !!opr.addons) || // eslint-disable-line no-undef
      // @ts-ignore
      !!window.opera ||
      navigator.userAgent.indexOf(" OPR/") >= 0;

    // Firefox 1.0+
    // @ts-ignore
    this.is_firefox = typeof mozInnerScreenX !== "undefined";

    // Safari 3.0+ "[object HTMLElementConstructor]"
    this.is_safari = (function () {
      if (/constructor/i.test(String(window["HTMLElement"]))) {
        return true;
      }
      let push: any;
      try {
        push = window.top["safari"].pushNotification;
      } catch {
        try {
          push = window["safari"].pushNotification;
        } catch {
          return false;
        }
      }
      return String(push) === "[object SafariRemoteNotification]";
    })();

    // Chrome 1+
    // @ts-ignore
    this.is_chrome = !!window.chrome;

    // Blink engine detection
    this.is_blink = (this.is_chrome || this.is_opera) && !!window.CSS;

    // Any browser on Mac
    this.is_mac =
      // @ts-ignore
      (
        window.navigator.oscpu ||
        window.navigator.platform ||
        window.navigator.appVersion ||
        "Unknown"
      ).indexOf("Mac") !== -1;

    // Any Windows
    this.is_win = navigator && !!/win/i.exec(navigator.platform);

    // iOS browsers
    this.is_ios =
      !!navigator.platform &&
      (/iPad|iPhone|iPod/.test(navigator.platform) ||
        (navigator.platform === "MacIntel" &&
          navigator.maxTouchPoints > 1 &&
          !window["MSStream"]));

    this.is_android = /android/i.test(navigator.userAgent);

    this.is_mobile = this.is_ios || this.is_android;
  }

  public getFlags(): { [key: string]: boolean } {
    return {
      is_opera: this.is_opera,
      is_firefox: this.is_firefox,
      is_safari: this.is_safari,
      is_chrome: this.is_chrome,
      is_blink: this.is_blink,
      is_mac: this.is_mac,
      is_win: this.is_win,
      is_ios: this.is_ios,
      is_android: this.is_android,
      is_mobile: this.is_mobile,
    };
  }
}

// 使用示例
export const browser = new BrowserDetector();
