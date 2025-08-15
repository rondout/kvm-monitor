/// <reference types="vite/client" />

declare global {
  const log: Console["log"];
  interface Window {
    log: Console["log"];
    closeAllModal: () => void;
    /** 用于和webview 通信 */
    chrome: {
      webview: {
        postMessage: <T = any>(data: T) => void;
      };
    };
    webkit?: {
      /** webview通信 */
      messageHandlers: {
        KVM: {
          postMessage: <T = any>(data: T) => void;
        };
      };
    };
    /** 设置p2p状态 */
    setP2pStatus: (value: boolean) => void;
    /** 退出全屏 */
    exitFullScreen: () => void;
    /** 设置上传文件是否由webview完成 */
    setUploadByWebview: (value: boolean) => void;
    /** 显示上传失败 */
    showUploadError: (errorType: UploadFailedEnum) => void;
    /** 开始上传 */
    startUpload: () => void;
    /** 设置上传进度 */
    setUploadProgress: (percent: number) => void;
    /** 上传完成 */
    completeUpload: (success: boolean) => void;
  }
  interface WebSocket {
    sendHidedEvent: (event: any) => void;
  }

  type MediaProvider = MediaStream & MediaSource & Blob;

  interface HTMLMediaElement {
    srcObject: MediaProvider;
  }
  interface UploadMessage {
    /** 上传文件的业务场景 */
    type: UploadFileType;
    accept?: string[];
    id?: string;
    [propName: string]: any;
  }

  interface Navigator {
    keyboard: {
      lock: (keycodes?: AllKeyboardKeys[]) => Promise<void>;
      unlock: () => Promise<void>;
    };
  }

  interface EventTarget {
    getBoundingClientRect: () => DOMRect;
    id: string | null;
    className: string | null;
  }
}

