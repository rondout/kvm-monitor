/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * @Author: shufei.han
 * @Date: 2024-11-20 16:21:48
 * @LastEditors: shufei.han
 * @LastEditTime: 2025-07-29 17:39:23
 * @FilePath: \gl-kvm-frontend\src\models\janus.model.ts
 * @Description: janus 有关的配置和方法
 */
import { Janus, JANUS_ERROR_TO_JANUS_ENUM_MAP } from '@/tools/janus'
// import { useKvmStore, type KvmConfigState, type StreamInfoTuple } from '@/stores/modules/kvm'
// import { useMsgStore } from '@/stores/modules/message'
// import { t } from '@/hooks/useLanguage'
// import { useServerStorageRef } from '@/hooks/useServerStorage'
// import { ServerStorageKeys } from './storage.model'
// import { useSystemStore } from '@/stores/modules/system'
import { sleep } from '@gl/main'
import type { KvmDeviceInfo } from './kvm.model';
// import { createVolumeMeter } from '@/tools/media'

type AnyFunction = (...args: any[]) => any;

export const $ = (id: string) =>
  document.getElementById(id) as HTMLVideoElement &
    HTMLImageElement &
    HTMLMediaElement

// @ts-ignore
export const $$ = (cls: string[]) => [].slice.call(document.getElementsByClassName(cls))
export const $$$ = (selector: string) => document.querySelectorAll(selector)

export interface GlJanusConfig {
    setActive?: () => void;
    setInactive?: () => void;
    setInfo?: (...args) => void;
    rtcConfig?: RTCConfiguration
}

export const nullFn = () => {}


export class JanusStreamer {
    public _Janus: any
    public janus: any
    public handle: any
    /** 是否是手动停止了janus */
    public stop = false
    public ensuring = false

    public retry_ensure_timeout = null
    public retry_emsg_timeout = null
    public info_interval = null

    public state = null
    public frames = 0
    private setActive: () => void = nullFn
    private setInactive: () => void = nullFn
    private setInfo: AnyFunction = nullFn
    private rtcConfig: RTCConfiguration
    private allow_mic: boolean
    private allow_camera: boolean
    private connectionType: 'p2p' | 'relay'

    public micTrack: MediaStreamTrack
    // private meter: ReturnType<typeof createVolumeMeter>

    constructor (
        private kvm: KvmDeviceInfo,
        private el: HTMLVideoElement | HTMLAudioElement,
        config: GlJanusConfig,
        // private configState: KvmConfigState,
        private allow_audio: boolean,
        private allow_video: boolean = true,
        private onRemoteTrack?: (track?: MediaStreamTrack) => void,
        private onLocalTrack?: (track?: MediaStreamTrack) => void,
        private onSdpStatus?: (success: boolean) => void,
    ) {
        // const allow_mic = false
        // this.allow_camera = allow_video && configState.cameraOn
        // this.allow_mic = allow_mic && !allow_video
        // this.allow_mic = allow_audio && allow_mic
        this.setActive = config.setActive || (nullFn)
        this.setInactive = config.setInactive || (nullFn)
        this.setInfo = config.setInfo || (nullFn)
        this.rtcConfig = config.rtcConfig
        this.initJanus(() => {
            this.ensureJanus()
        })
    }

    ensureStream () {
        this.ensureJanus()
    }
    initJanus (callback: () => void) {
        Janus.init({
            debug: 'all',
            id: this.kvm.id,
            callback: () => {
                this._Janus = Janus
                callback()
            },
        })
    }

    attachJanus () {
        const { janus } = this
        if (janus === null) {
            return
        }
        janus.attach({
            plugin: 'janus.plugin.ustreamer',
            opaqueId: 'oid-' + this._Janus.randomString(12),

            success: (handle) => {
                this.handle = handle
                this.sendWatch()
            },

            error: (error) => {
                // log('Can\'t attach uStreamer: ', error)
                this.setInfo(false, false, error)
                this.destroyJanus()
            },

            connectionState: (state) => {
                // log('Peer connection state changed to', state)
                if (state === 'failed') {
                    this.destroyJanus()
                }
            },

            iceState: (state) => {
                // log('ICE state changed to', state)
            },

            webrtcState: (up) => {
                // log(
                //     'Janus says our WebRTC PeerConnection is',
                //     up ? 'up' : 'down',
                //     'now',
                // )
                if (up) {
                    this.sendKeyRequired()
                }
            },

            onmessage: (msg, jsep) => {
                this.stopRetryEmsgInterval()
                if (msg.result) {
                    // log('Got uStreamer result message:', msg.result.status) // starting, started, stopped
                    if (msg.result.status === 'started') {
                        this.setActive()
                        this.setInfo(false, false, '')
                    } else if (msg.result.status === 'stopped') {
                        this.setInactive()
                        this.setInfo(false, false, '')
                    } else if (msg.result.status === 'features') {
                        // tools.feature.setEnabled($("stream-audio"), msg.result.features.audio);
                        // tools.feature.setEnabled($('stream-mic'), msg.result.features.mic)
                        // this.sendWatch()
                    }
                } else if (msg.error_code || msg.error) {
                    // log('Got uStreamer error message:', msg.error_code, '-', msg.error)
                    this.setInfo(false, false, msg.error)
                    if (this.retry_emsg_timeout === null) {
                        this.retry_emsg_timeout = setTimeout(() => {
                            if (!this.stop) {
                                this.sendStop()
                                this.sendWatch()
                            }
                            this.retry_emsg_timeout = null
                        }, 2000)
                    }
                    return
                } else {
                    log('Got uStreamer other message:', msg)
                }

                if (jsep) {
                    // log('Handling SDP:', jsep)
                    const tracks = [{ type: 'video', capture: this.allow_camera, recv: true, add: true }]
                    if (this.allow_audio || this.allow_mic) {
                        tracks.push({ type: 'audio', capture: this.allow_mic, recv: this.allow_audio, add: true })
                    }
                    this.handle.createAnswer({
                        jsep: jsep,
                        tracks: tracks,
                        // media: { audioSend: false, videoSend: false, data: false },
                        // Chrome is playing OPUS as mono without this hack
                        //   - https://issues.webrtc.org/issues/41481053 - IT'S NOT FIXED!
                        //   - https://github.com/ossrs/srs/pull/2683/files
                        customizeSdp: (jsep) => {
                            jsep.sdp = jsep.sdp.replace('useinbandfec=1','useinbandfec=1;stereo=1')
                        },

                        success: (jsep) => {
                            this.sendStart(jsep)
                            this.onSdpStatus?.(true)
                        },
                        
                        error: (error) => {
                            this.onSdpStatus?.(false)
                            this.setInfo(false, false, error)
                            this.destroyJanus()
                        },
                    })
                }
            },

            // Janus 1.x
            onremotetrack: (track: MediaStreamTrack, id, added, meta) => {
                // Chrome sends `muted` notification for tracks in `disconnected` ICE state
                // and Janus.js just removes muted track from list of available tracks.
                // But track still exists actually so it's safe to just ignore
                // reason == "mute" and "unmute".
                const reason = (meta || {}).reason
                // log('Got onremotetrack:', id, added, reason, track, meta)
                if (added && reason === 'created') {
                    this.addTrack(track)
                    if (track.kind === 'video') {
                        this.sendKeyRequired()
                        this.startInfoInterval()
                        this.getConnectionType()
                    }
                } else if (!added && reason === 'ended') {
                    this.removeTrack(track)
                }
            },

            onlocaltrack: (track: MediaStreamTrack) => {
                // // @ts-ignore
                // const el = document.querySelector('#local-stream-video') as HTMLVideoElement
                // el.srcObject = null
                // if (this.allow_mic && track.kind === 'audio') {
                //     this.micTrack = track
                //     // requestAnimationFrame(console.log(getCurrentVolume(track)))
                //     this.meter = createVolumeMeter(track)
                //     this.meter.start(v => {
                //         // log('volume: ', v)
                //         useKvmStore().setMicVolume(v)
                //     })
                //     if (useSystemStore().state.micMuted) {
                //         this.setMicEnabled(false)
                //     }
                // }
                // this.addTrack(track, el)
                // this.onLocalTrack?.(track)
            },


            oncleanup: () => {
                // log('Got a cleanup notification')
                this.stopInfoInterval()
            },
        })
    }

    async getConnectionType () {
        try {
            const res = await this.handle.getRtcStats()
            if (res.enabled) {
                this.connectionType = res.type
            }   
            await sleep(5000)
            this.getConnectionType()
        } catch (error) {
            await sleep(5000)
            this.getConnectionType()
        }
    }

    public setMicEnabled (enabled: boolean) {
        if (this.micTrack) {
            this.micTrack.enabled = enabled
            return true
        }
        return false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ensureJanus ( ) {
        log('ensureJanus', this.kvm)
        const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
        const config = {
            server: `${wsProtocol}://${location.host}/kvm-api/${this.kvm.id}/janus/ws`,
            success: () => {
                this.attachJanus()
            },
            ...(this.rtcConfig || {}),
            // 第二个参数可选，如果传了，就用这个code去翻译，没传就用err
            error: (err: string) => {
                const errorEnum = JANUS_ERROR_TO_JANUS_ENUM_MAP.get(err)
                if (errorEnum !== undefined) {
                    this.setInfo(false, false, ('error.' + errorEnum))
                } else {
                    this.setInfo(false, false, err)
                }
                this.__finishJanus()
            },
            destroyOnUnload: false,

        }
        log('WebRTC Config: ', config)
        this.janus = new this._Janus(config)
        // log(this.janus)
    // @ts-ignore
    }
    destroyJanus () {
        try {
            
            if (this.janus !== null) {
                this.janus.destroy()
            }
            this.__finishJanus()
            const stream = this.el.srcObject
            if (stream) {
                // @ts-ignore
                for (const track of stream.getTracks()) {
                    this.removeTrack(track)
                }
            }
        } catch (error) {
            // 
        }
    }

    public stopStream () {
        this.stop = true
        this.destroyJanus()
        // this.meter?.stop?.()
        // useKvmStore().setMicVolume(null)
    }
    __finishJanus () {
        if (this.stop) {
            if (this.retry_ensure_timeout !== null) {
                clearTimeout(this.retry_ensure_timeout)
                this.retry_ensure_timeout = null
            }
            this.ensuring = false
        } else {
            if (this.retry_ensure_timeout === null) {
                this.retry_ensure_timeout = setTimeout(() => {
                    this.retry_ensure_timeout = null
                    this.ensureJanus()
                }, 5000)
            }
        }
        this.stopRetryEmsgInterval()
        this.stopInfoInterval()
        if (this.handle) {
            this.handle.detach()
            this.handle = null
        }
        this.janus = null
        this.setInactive()
        if (this.stop) {
            this.setInfo(false, false, '')
        }
    }

    stopRetryEmsgInterval () {
        if (this.retry_emsg_timeout !== null) {
            clearTimeout(this.retry_emsg_timeout)
            this.retry_emsg_timeout = null
        }
    }

    stopInfoInterval () {
        if (this.info_interval !== null) {
            clearInterval(this.info_interval)
        }
        this.info_interval = null
    }

    isOnline () {
        // return useMsgStore().isStreamOnline
    }

    sendKeyRequired () {}

    startInfoInterval () {
        this.stopInfoInterval()
        this.setActive()
        this.updateInfo()
        this.info_interval = setInterval(() => this.updateInfo(), 1000)
    }

    updateInfo () {
        try {
            if (this.handle !== null) {
                let info = ''
                let fps: number = null
                if (this.handle !== null) {
                    // https://wiki.whatwg.org/wiki/Video_Metrics
                    let frames = null
                    // @ts-ignore
                    const el = this.el
                    // @ts-ignore
                    if (el.webkitDecodedFrameCount !== undefined) {
                        // @ts-ignore
                        frames = el.webkitDecodedFrameCount
                        // @ts-ignore
                    } else if (el.mozPaintedFrames !== undefined) {
                        // @ts-ignore
                        frames = el.mozPaintedFrames
                    }
    
                    info = `${this.handle.getBitrate()}`.replace('kbits/sec', 'kbps')
                    if (frames !== null) {
                        fps = Math.max(0, (frames - this.frames))
                        // fps = Math.max(0, Math.round((frames - this.frames) / 2))
                        info += ` / ${fps} fps ` + ('dynamic')
                        this.frames = frames
                    }
                }
                this.setInfo(true, this.isOnline(), info, {fps, connectionType: this.connectionType})
            }
        } catch (error) {
            // 
        }
    }

    sendStop () {
        this.stopInfoInterval()
        if (this.handle) {
            // log('Sending STOP ...')
            this.handle.send({ message: { request: 'stop' } })
            this.handle.hangup()
        }
    }

    sendWatch () {
        if (this.handle) {
            this.handle.send({ message: { request: 'features' } })
            log('send watch: ', {
                orientation: this.getOrientation(),
                audio: this.allow_audio || this.allow_mic,
                video: this.allow_video,
                mic: this.allow_mic,
                camera: this.allow_camera,
            })
            this.handle.send({
                message: {
                    request: 'watch',
                    params: {
                        orientation: this.getOrientation(),
                        audio: this.allow_audio || this.allow_mic,
                        video: this.allow_video,
                        mic: this.allow_mic,
                        camera: this.allow_camera,
                    },
                },
            })
        }
    }

    addTrack (track: MediaStreamTrack, el = this.el) {
        if (el.srcObject) {
            // @ts-ignore
            for (const tr of el.srcObject.getTracks()) {
                if (tr.kind === track.kind && tr.id !== track.id) {
                    this.removeTrack(tr)
                }
            }
        }
        if (!el.srcObject) {
            el.srcObject = new MediaStream()
            this.onRemoteTrack?.()
        }
        // @ts-ignore
        el.srcObject.addTrack(track)
    }

    removeTrack (track) {
        const el = this.el
        if (!el.srcObject) {
            return
        }
        track.stop()
        // @ts-ignore
        el.srcObject.removeTrack(track)
        // @ts-ignore
        if (el.srcObject.getTracks().length === 0) {
            // MediaStream should be destroyed to prevent old picture freezing
            // on Janus reconnecting.
            el.srcObject = null
        }
    }

    sendStart (jsep: string) {
        if (this.handle) {
            this.handle.send({ message: { request: 'start' }, jsep: jsep })
        }
    }

    public getOrientation () {
        // return useServerStorageRef(ServerStorageKeys.ORIENTATION).value
    }
    public isAudioAllowed () {
        return this.allow_audio
    }

    public getName () {
        let name = 'WebRTC H.264'
        if (this.allow_audio) {
            name += ' + Audio'
        }
        if (this.allow_mic) {
            name += ' + Mic'
        }
        return name
    }
    public getMode () {
        return 'janus'
    }

    public getResolution () {
        if (this.el instanceof HTMLVideoElement) {
            const el = this.el
            return {
                real_width: el.videoWidth || el.offsetWidth,
                real_height: el.videoHeight || el.offsetHeight,
                view_width: el.offsetWidth,
                view_height: el.offsetHeight,
            }
        }
    }
}
