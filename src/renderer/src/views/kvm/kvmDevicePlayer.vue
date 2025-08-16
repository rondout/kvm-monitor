<template>
  <div
    id="stream-window"
    ref="streamWindowRef"
    :class="{
      'bg-default': true,
      bordered: true,
      'stream-window-inited': state.initVideoJanusFinished
    }"
  >
    <div
      :id="STREAM_BOX_ID"
      ref="streamBoxRef"
      @blur="handleStreamBoxBlur"
      @focus="handleStreamBoxFocus"
      @click="handleStreamBoxFocus"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <video
        :id="videoElId"
        ref="streamVideoRef"
        class="full-width kvm-video"
        playsinline
        autoplay
        muted
      ></video>
      <!-- <canvas v-else-if="kvmStore.isDirectMode" :id="kvmStore.videoElId" ref="streamCanvasRef"></canvas>
            <NoaHdmiSignalPage v-if="kvmStore.noHDMISignal" />
            <MicroPhoneStatus v-if="kvmStore.isWebrtcMode" /> -->
    </div>
    <div
      v-if="!state.initVideoJanusFinished"
      class="stream-window-wrapper position-absolute bg-default"
    ></div>
    <!-- <Teleport to="body">
            <video ref="localStreamVideoRef" v-show="state.showLocalStream && kvmStore.configState.cameraOn"
                id="local-stream-video" playsinline autoplay muted></video>
        </Teleport> -->
  </div>
</template>

<script setup lang="ts">
// import useWindowSize from '@renderer/hooks/useWindowSize'
import { JanusStreamer } from '@renderer/models/janus.model'
import { MouseEventHandler } from '@renderer/models/mouse.model'
// import { calcStreamWindowSize } from '@renderer/models/player.model'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
// import { Modal, Spin } from 'ant-design-vue'
// import FullscreenHeaderBox from './fullscreenHeaderBox.vue'
// import { useMouseSettings } from '@renderer/hooks/useMouseSettings'
// import NoaHdmiSignalPage from '@renderer/components/display/noaHdmiSignalPage.vue'
// import { MediaStreamer } from '@renderer/models/media.model'
// import useElementMove, { MoveBoundary } from '@renderer/hooks/useElementMove'
// import { debounce } from '@gl/main'
// import { KeyboardEventHandler } from '@renderer/utils/keyboard'
// import { ServerStorageKeys } from '@renderer/models/storage.model'
// import { useServerStorageRef } from '@renderer/hooks/useServerStorage'
// import { useGlobalStore } from '@renderer/stores'
// import type { StreamInfoTuple } from '@renderer/stores/modules/kvm'
// import MicroPhoneStatus from './components/microPhoneStatus.vue'
// import { t } from '@renderer/hooks/useLanguage'
import { browser } from '@renderer/tools'
import { KvmStreamConnector, type KvmDeviceInfo } from '@renderer/models/kvm.model'

const streamWindowRef = ref<HTMLDivElement>()
const streamBoxRef = ref<HTMLElement>()
const streamVideoRef = ref<HTMLVideoElement>()
const localStreamVideoRef = ref<HTMLVideoElement>()
// const streamCanvasRef = ref<HTMLCanvasElement>()
// const audioRef = ref<HTMLAudioElement>()

const props = defineProps<{
  kvm: KvmDeviceInfo
}>()

const STREAM_BOX_ID = 'stream-box' + props.kvm.id
const videoElId = `kvm-video-${props.kvm.id}`

// const { msgStore, kvmStore, settingsStore, configStore, serverStorageStore, systemStore } = useGlobalStore()
// const { width, height } = useWindowSize()
// const { isMouseAbsolute } = useMouseSettings(streamBoxRef)
// const { computedStyle } = useElementMove(localStreamVideoRef, localStreamVideoRef, MoveBoundary.VIEW_PORT_IN)

/** 组件状态 */
const state = reactive({
  info: [],
  videoJanus: {} as JanusStreamer,
  audioJanus: {} as JanusStreamer,
  mouseHandler: null as MouseEventHandler,
  // keyboardHandler: null as KeyboardEventHandler,
  wideScreen: false,
  /** 初始化视频流 Janus 完成 */
  initVideoJanusFinished: false,
  showLocalStream: false
})

// const orientation = useServerStorageRef(ServerStorageKeys.ORIENTATION)

// const containerClass = computed(() => {
//     return {
//         'player-container full-height': true,
//         'wide-screen-player': state.wideScreen,
//         'full-screen-player': configStore.state.fullScreenOn,
//         'header-collapsed': configStore.state.headerCollapsed,
//         'hdmi-lost': kvmStore.noHDMISignal,
//     }
// })

// enum ConfigAudioType {
//     ENABLE_MIC = 'ENABLE_MIC',
//     ENABLE_SOUND = 'ENABLE_SOUND',
//     STOP_SOUND = 'STOP_SOUND',
//     STOP_MIC = 'STOP_MIC',
//     STOP_MIC_AND_SOUND = 'STOP_MIC_AND_SOUND',
//     ENABLE_MIC_AND_SOUND = 'ENABLE_MIC_AND_SOUND'
// }

/** 设置音频有关 */
// const configAudioStreamer = async (type: ConfigAudioType) => {
//     await msgStore.waitForRtcConfig()
//     state.audioJanus?.stopStream?.()
//     // if (!kvmStore.isWebrtcMode) {
//     //     state.audioJanus = null
//     //     return
//     // }
//     /** 只有在mic或者sound打开时，才需要打开音频流，否则直接关闭 */
//     const { micMuted } = systemStore.state
//     const { volumeOn } = kvmStore.configState
//     const micOnOrSoundOn = !micMuted || volumeOn
//     if (!micOnOrSoundOn || type === ConfigAudioType.STOP_MIC_AND_SOUND) {
//         state.audioJanus = null
//         return
//     }
//     state.audioJanus = new JanusStreamer(
//         audioRef.value, { rtcConfig: msgStore.rtcConfig },
//         // TODO 这里allow_video必须为true，否则没有声音，这个问题亟需固件端解决
//         kvmStore.configState, volumeOn, false,
//         debounce(() => {
//             setTimeout(() => {
//                 if (volumeOn) {
//                     audioRef.value.play()
//                     audioRef.value.volume = 1
//                 }
//             }, 100)
//         }),
//         undefined,
//         (status) => {
//             if (status) {
//                 return
//             }
//             if ([ConfigAudioType.ENABLE_MIC, ConfigAudioType.ENABLE_MIC_AND_SOUND].includes(type)) {
//                 Modal.info({
//                     centered: true,
//                     title: t('system.micPermissionError'),
//                     content: t('system.micPermissionErrorContent'),
//                     okText: t('common.gotIt'),
//                 })
//                 systemStore.setMicMuted(true)
//             }
//         })
// }
/** 鼠标进入窗口，开启鼠标控制 */
const handleMouseEnter = () => {
  // if (isMouseAbsolute.value) {
  //     kvmStore.setMouseEnabled(true)
  // }
}
/** 鼠标离开窗口，关闭鼠标控制 */
const handleMouseLeave = () => {
  // if (isMouseAbsolute.value) {
  //     kvmStore.setMouseEnabled(false)
  // }
}
const handleStreamBoxBlur = () => {
  // 这里当鼠标离开窗口时，清空所有按下的按键，避免出现卡键的情况
  // KeyboardEventHandler.clearAllPressDownKeys()
  // kvmStore.setKeyboardEnabled(false)
}
const handleStreamBoxFocus = () => {
  // kvmStore.setKeyboardEnabled(true)
  streamBoxRef.value?.focus()
}
// 连接成功
const setActive = (isMediaAndFirst = false) => {
  if (browser.is_safari) {
    state.initVideoJanusFinished = true
  }
  // calcStreamWindowSize(streamWindowRef.value)
  // kvmStore.setStreamState(true)
  // if (kvmStore.isWebrtcMode) {
  //     calcStreamWindowSize(streamWindowRef.value)
  // } else if (isMediaAndFirst) {
  //     calcStreamWindowSize(streamWindowRef.value)
  // }
}
// 断开连接
const setInactive = () => {
  // state.initVideoJanusFinished = true
  // kvmStore.setStreamState(false)
}
// 更新状态信息
const setInfo = (...args) => {
  const fps = args[3]?.fps
  if (fps) {
    state.initVideoJanusFinished = true
  }
  // if (!kvmStore.isWebrtcMode) {
  //     kvmStore.setStreamState(true)
  // }
  // kvmStore.setStreamInfo(args)
}

/** 初始化 Janus（webrtc视频流连接） */
const initJanus = async () => {
  // await msgStore.waitForRtcConfig()
  state.videoJanus?.stopStream?.()
  // state.videoMedia?.stopStream?.()
  state.showLocalStream = false
  state.initVideoJanusFinished = false
  // const rtcConfig = msgStore.rtcConfig
  const janus = new JanusStreamer(
    props.kvm,
    streamVideoRef.value,
    { setActive, setInactive, setInfo, rtcConfig: undefined },
    false,
    true,
    async () => {
      state.initVideoJanusFinished = true
    },
    () => {
      state.showLocalStream = true
    }
  )
  state.videoJanus = janus
  // msgStore.setVideoJanusName(janus.getName())
}
const initMediaStreamer = () => {
  // state.videoMedia?.stopStream?.()
  state.videoJanus?.stopStream?.()
  state.showLocalStream = false
  state.initVideoJanusFinished = false
  // if (kvmStore.noHDMISignal) {
  //     state.initVideoJanusFinished = true
  // }
  // configAudioStreamer(ConfigAudioType.STOP_MIC_AND_SOUND)
  // state.videoMedia = new MediaStreamer(
  //     streamCanvasRef.value,
  //     {
  //         setActive, setInactive, setInfo, organizeHook() {

  //         }
  //     },
  // )
  // msgStore.setVideoJanusName(state.videoMedia.getName())
}
/** 初始化 */
const init = () => {
  // if (kvmStore.isWebrtcMode) {
  new KvmStreamConnector(props.kvm, videoElId, STREAM_BOX_ID)
  initJanus()
  // } else if (kvmStore.isDirectMode) {
  //     initMediaStreamer()
  // }
}

// const initAudioAndMic = () => {
//     configAudioStreamer(ConfigAudioType.ENABLE_MIC_AND_SOUND)
// }

// const initMouseKeyboard = () => {
//     state.mouseHandler = new MouseEventHandler(streamBoxRef.value)
//     state.keyboardHandler = new KeyboardEventHandler(streamBoxRef.value)
// }

onMounted(async () => {
  init()
  // initAudioAndMic()
  // initMouseKeyboard()
  // calcStreamWindowSize(streamWindowRef.value)
  // 在这里注册重连事件，重连后需要重新初始化 Janus，以及判断之前的声音会否开启
  // configStore.on('reconnected', () => {
  //     closeStream()
  //     init()
  //     // initAudioAndMic()
  //     // if (kvmStore.configState.volumeOn || !systemStore.state.micMuted) {
  //     //     // 如果断开连接之前声音是开启的状态，需要重新开启声音
  //     //     configAudioStreamer(ConfigAudioType.ENABLE_MIC_AND_SOUND)
  //     // }
  // })
})

const closeStream = () => {
  state.videoJanus?.stopStream?.()
  // state.videoMedia?.stopStream?.()
  // configAudioStreamer(ConfigAudioType.STOP_MIC_AND_SOUND)
}

onBeforeUnmount(() => {
  closeStream()
})
/** 触发窗口大小计算的依赖项 */
// const triggers = computed(() => {
//     return [msgStore.streamerState?.streamer?.source.resolution,
//         width, height, configStore.state.headerCollapsed, configStore.leftPanelOpen,
//     settingsStore.virtualKeyboardFixed, settingsStore.virtualKeyboardAvailableWidth]
// })

// watch(triggers, () => {
//     /** 计算窗口大小 */
//     calcStreamWindowSize(streamWindowRef.value)
// }, { deep: true })
// // header 折叠状态变化，重新计算窗口大小
// watch(() => configStore.state.headerCollapsed, () => {
//     // 之所以要延时300ms是因为header的收缩和展开是有300ms的动画时间
//     setTimeout(() => {
//         calcStreamWindowSize(streamWindowRef.value)
//     }, 300)
// })
// // 屏幕方向变化，重新初始化 Janus/Media
// watch(() => [orientation.value, kvmStore.isWebrtcMode], () => {
//     nextTick(() => {
//         init()
//     })
// })
// // 音量变化，开启和关闭音频
// watch(() => kvmStore.configState.volumeOn, (v) => {
//     if (v) {
//         configAudioStreamer(ConfigAudioType.ENABLE_SOUND)
//     } else {
//         configAudioStreamer(ConfigAudioType.STOP_SOUND)
//     }
// })
// // 麦克风状态变化，开启和关闭麦克风
// watch(() => systemStore.state.micMuted, (value) => {
//     if (state.audioJanus?.micTrack) {
//         state.audioJanus.setMicEnabled(!value)
//         return
//     }
//     if (!value) {
//         configAudioStreamer(ConfigAudioType.ENABLE_MIC)
//     } else {
//         configAudioStreamer(ConfigAudioType.STOP_MIC)
//     }
// })
// // 摄像头状态变化，开启和关闭摄像头
// watch(() => kvmStore.configState.cameraOn, () => {
//     if (kvmStore.isWebrtcMode) {
//         initJanus()
//     }
// })
// watch(() => kvmStore.noHDMISignal, (v) => {
//     if (v) {
//         state.initVideoJanusFinished = true
//     }
// })
</script>

<style lang="scss" scoped>
.player-container {
  overflow: hidden;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  // align-items: flex-end;
  align-items: center;

  .player-content {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    overflow: auto;
  }
}

.wide-screen-player {
  #stream-window {
    width: 100% !important;
    height: 100% !important;
  }
}

.full-screen-player {
  .header-tool {
    opacity: 0.88;
  }

  #stream-window {
    border-radius: 0;
  }
}

.header-collapsed {
  #stream-window {
    #stream-box {
      height: 100%;
    }
  }
}

#stream-window {
  // visibility: hidden;
  outline: none;
  overflow: hidden;
  position: relative;
  // resize: both;
  // border: 2px solid #282a2e;
  box-sizing: border-box;
  white-space: nowrap;
  // min-width: 400px;
  // min-height: 200px;
  height: 100%;
  width: 100%;

  // opacity: 0;
  #stream-box {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    display: inline-flex;
    justify-content: center;

    #stream-video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      outline: none;
      // mix-blend-mode: screen;
    }
  }

  .no-cursor {
    cursor: none;
  }

  .stream-window-wrapper {
    // background-color: ;
    width: 100%;
    height: 100%;
    top: 0;
  }

  &.stream-window-inited {
    opacity: 1;
    animation: glOpacityAnimation 1s ease-in;
    transition:
      height 0.3s linear,
      width 0.3s linear;
  }
}

.hdmi-lost {
  #stream-window {
    background-color: #262626 !important;
  }
}

.header-tool {
  position: absolute;
  z-index: 1;
}

:deep(.ant-spin-nested-loading) {
  width: 100%;
  height: 100%;

  & > div {
    height: 100%;
    position: absolute;
    width: 100%;

    .ant-spin-spinning {
      height: 100%;
      position: absolute;
      width: 100%;
      max-height: unset;
    }
  }

  .ant-spin-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
}

.kvm-video {
  display: block;
}

#local-stream-video {
  position: absolute;
  /* z-index: 1; */
  width: 163px;
  background: #000;
  right: 0;
  top: 50px;
}

@keyframes glOpacityAnimation {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
