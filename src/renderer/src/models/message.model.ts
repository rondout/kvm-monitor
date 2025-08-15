import { WsEventType, type KvmDeviceInfo, type WsMessage } from './kvm.model'
import { computed, reactive, ref } from 'vue'
import {
  isEqualJsonObj,
  type AtxEventState,
  type FingerbotEventState,
  type HidEventState,
  type StreamEventState,
  type TurnMsgInfo
} from './state.model'
import { WebSocketService } from '@renderer/api/websocket'
import { sleep } from '@gl/main'

type MsgEventType = 'turn_change'

export const useWsMessage = (kvm: KvmDeviceInfo, onOpen?: (socket?: WebSocketService) => void) => {
  const webrtcTurnConfigWaited = ref(false)
  /** 是否已经等待过turn服务（只等待一次） */
  //   const configStore = useConfigStore();
  /** 消息列表 */
  const msgs = ref<WsMessage[]>([])
  /** 最新的api消息 */
  const latestWsApiMessage = ref<WsMessage>()
  /** 最新的janus消息 */
  const latestJanusApiMessage = ref<WsMessage>()
  /** 播放流状态 */
  const streamerState = ref<StreamEventState>()
  /** 元数据 */
  // const metaState = ref<StreamEventState>()
  // /** 系统状态 */
  // const systemState = ref<StreamEventState>()
  // /** 额外信息 */
  // const extraState = ref<StreamEventState>()
  /** hid信息 */
  const hidState = ref<HidEventState>()
  /** atx信息 */
  const atxState = ref<AtxEventState>()
  /** turn 信息 */
  const turnState = ref<TurnMsgInfo>()
  /** 手指机器人状态 */
  const fingerbotState = ref<FingerbotEventState>()
  /** 视频 janus 的名称 */
  const videoJanusName = ref('')
  /** 在线状态 */
  const connected = computed(() => !!sockets.apiWS)
  /** 正在设置的值 */
  const settingConfig = ref({
    h264_bitrate: null,
    h264_gop: null
  })
  /** sockets 两个  /api/ws 和 janus/ws 两个ws */
  const sockets = reactive<{ apiWS: WebSocketService; janusWS: WebSocketService }>({
    /** apiWs主要是用于传递一些状态信息之类的 */
    apiWS: null as WebSocketService,
    /** janusWs是janus服务发送的消息（主要是webRtc媒体流有关的） */
    janusWS: null as WebSocketService
  })

  const listeners = new Map<MsgEventType, () => void>()

  const on = (type: MsgEventType, callback: () => void) => {
    listeners.set(type, callback)
  }

  /** 初始化/api/ws的消息连接 */
  const initApiWsMsgs = async () => {
    if (sockets.apiWS) {
      return
    }
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocketService<WsMessage>(
      `${wsProtocol}://localhost:4004/kvm-api/${kvm.id}/api/ws`,
      null,
      (data) => {
        latestWsApiMessage.value = data
        msgs.value.push(data)
        parseData(data)
      },
      true
    )

    socket.on('open', () => {
      sockets.apiWS = socket
      onOpen?.(socket)
    })
  }
  const mouseAbsolute = computed(() => {
    if (!hidState.value) {
      return true
    }
    return hidState.value.mouse.absolute
  })
  /** 视频流是否在线 */
  const isStreamOnline = computed(() => {
    if (!streamerState.value) {
      return false
    }
    return streamerState.value.streamer?.source?.online
  })

  const closeApiWs = () => {
    sockets.apiWS?.close()
    sockets.apiWS = null
  }

  const initJanusWsMsgs = async () => {
    if (sockets.apiWS) {
      return
    }
    const socket = new WebSocketService<WsMessage>('/janus/ws', 'janus-protocol', (data) => {
      latestJanusApiMessage.value = data
      msgs.value.push(data)
    })

    socket.on('open', () => {
      sockets.apiWS = socket
    })
  }
  /** 初始化api/ws的消息连接 */
  initApiWsMsgs()
  /** 设置流媒体信息 */
  const setStreamerState = (data: StreamEventState) => {
    const { params } = data
    // 这里有做处理，如果系统设置了bitrate 或 gop，但是收到的消息反过来的还是设置前的，就忽略消息
    if (settingConfig.value.h264_bitrate) {
      if (settingConfig.value.h264_bitrate !== params.h264_bitrate) {
        params.h264_bitrate = settingConfig.value.h264_bitrate
      } else {
        settingConfig.value.h264_bitrate = null
      }
    }
    if (settingConfig.value.h264_gop !== null) {
      if (settingConfig.value.h264_gop !== params.h264_gop) {
        params.h264_gop = settingConfig.value.h264_gop
      } else {
        settingConfig.value.h264_gop = null
      }
    }
    streamerState.value = data
  }
  /** 解析消息 */
  const parseData = (data: WsMessage) => {
    switch (data.event_type) {
      case WsEventType.STREAMER_STATE:
        // eslint-disable-next-line no-case-declarations
        setStreamerState(data.event as StreamEventState)
        break
        // case WsEventType.INFO_META_STATE:
        //     metaState.value = data.event
        //     break
        // case WsEventType.INFO_EXTRAS_STATE:
        //     extraState.value = data.event
        //     break
        // case WsEventType.INFO_SYSTEM_STATE:
        //     systemState.value = data.event
        break
      case WsEventType.HID_STATE:
        hidState.value = data.event
        break
      case WsEventType.ATX_STATE:
        atxState.value = data.event
        break
      case WsEventType.FINGERBOT_STATE:
        fingerbotState.value = data.event
        break
      case WsEventType.MSD_STATE:
        // useMSDStore().setMSDState(data.event);
        break
      case WsEventType.TURN_STATE:
        setTurnState(data.event)
        webrtcTurnConfigWaited.value = true
        break
    }
  }
  /** 模拟的鼠标个数 */
  const mouseMockCount = computed(() => {
    try {
      return hidState.value.mouse.outputs.available.length
    } catch (error) {
      return null
    }
  })
  /** 将后端给的turn配置转为前端的turn配置 */
  const rtcConfig = computed<RTCConfiguration>(() => {
    // return {}
    if (!turnState.value) {
      return {
        iceTransportPolicy: 'all'
      }
    }
    return {
      iceTransportPolicy: 'all',
      iceServers: [
        {
          urls: turnState.value.uris,
          username: turnState.value.username,
          credential: turnState.value.password
        }
      ]
    }
  })
  /** 等待rtcConfig 配置完成 */
  const waitRtcConfigOnly = async () => {
    if (webrtcTurnConfigWaited.value) {
      return
    }
    await sleep(100)
    await waitRtcConfigOnly()
  }
  /** 等待rtcConfig 配置完成但是设置最大等待时间 */
  const waitForRtcConfig = async () => {
    const MAX_WAIT_RTC_CONFIG_TIME = 5000
    await Promise.race([waitRtcConfigOnly(), sleep(MAX_WAIT_RTC_CONFIG_TIME)])
    webrtcTurnConfigWaited.value = true
  }

  /** 设置视频 janus 的名称 */
  const setVideoJanusName = (name: string) => {
    videoJanusName.value = name
  }

  /** 分辨率信息 */
  const resolutionText = computed(() => {
    try {
      const title = videoJanusName.value
      const { width, height } = streamerState.value.streamer.source.resolution
      return `${title} - ${width}x${height} / `
    } catch (error) {
      return ''
    }
  })

  const resolutionTextOnly = computed(() => {
    try {
      const { width, height } = streamerState.value.streamer.source.resolution
      return `${width}x${height}`
    } catch (error) {
      return ''
    }
  })

  /** 是否插入了atx power */
  const atxPowerEnabled = computed(() => {
    return atxState.value?.enabled
  })
  /** 是否插入了fingerbot */
  const fingerbotEnabled = computed(() => {
    return fingerbotState.value?.exist
  })
  /** 判断是否插入了hdmi线 */
  const hdmiLinePlugged = computed(() => {
    return streamerState.value?.streamer?.hdmi?.signal
  })

  const setTurnState = (data: TurnMsgInfo) => {
    if (turnState.value && isEqualJsonObj(turnState.value, data)) {
      return
    }
    const oldValue = turnState.value
    turnState.value = data
    if (oldValue) {
      listeners.get('turn_change')?.()
    }
  }

  //   const getTurnConfigManually = async () => {
  //     try {
  //       const data = await mainService.getRtcTurnConfig();
  //       setTurnState(data);
  //       webrtcTurnConfigWaited.value = true;
  //     } catch (error) {
  //       //
  //     }
  //   };

  //   getTurnConfigManually();

  //   watch(
  //     () => atxPowerEnabled.value || fingerbotEnabled.value,
  //     (val) => {
  //       if (
  //         !val &&
  //         configStore.state.leftPanelEnum === LeftPanelEnum.EXTERNAL_DEVICES
  //       ) {
  //         configStore.toggleLeftPanel(LeftPanelEnum.NONE);
  //       }
  //     }
  //   );

  return {
    webrtcTurnConfigWaited,
    msgs,
    latestWsApiMessage,
    latestJanusApiMessage,
    initApiWsMsgs,
    closeApiWs,
    initJanusWsMsgs,
    setVideoJanusName,
    resolutionText,
    streamerState,
    // metaState,
    hidState,
    atxState,
    fingerbotState,
    // systemState,
    // extraState,
    sockets,
    connected,
    rtcConfig,
    setStreamerState,
    settingConfig,
    isStreamOnline,
    atxPowerEnabled,
    fingerbotEnabled,
    resolutionTextOnly,
    hdmiLinePlugged,
    mouseAbsolute,
    waitForRtcConfig,
    mouseMockCount,
    on
  }
}
