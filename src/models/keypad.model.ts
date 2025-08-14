import { browser } from '@/tools'

/**
 * @fileoverview 该文件暂时不用，这是搬运了KVMD的源码做参考，后续可能需要
 */
export class KeypadHandler {
    private __merged = {}
    private __keys = {}
    private __modifiers = {}

    private __fix_mac_cmd = browser.is_mac
    private __fix_win_altgr = browser.is_win
    private __altgr_ctrl_timer = null
    constructor (public __keys_parent, public __sendKey) {}
    public emitByCode (code, state, apply_fixes=true) {
        log('emitByCode', code, state)
        if (code in this.__merged) {
            if (this.__fix_win_altgr && apply_fixes) {
                if (!this.__fixWinAltgr(code, state)) {
                    return
                }
            }
            if (this.__fix_mac_cmd && apply_fixes) {
                this.__fixMacCmd(code, state)
            }
            this.__commonHandler(this.__merged[code][0], state, false)
            this.__unholdModifiers()
        }
    }

    private __unholdModifiers () {
        for (const code in this.__modifiers) {
            const el_key = this.__modifiers[code][0]
            if (this.__isHolded(el_key)) {
                this.__deactivate(el_key)
                this.__process(el_key, false)
            }
        }
    }

    private __isHolded (el_key) {
        let is_holded = false
        const el_keys = this.__resolveKeys(el_key)
        for (el_key of el_keys) {
            is_holded = (is_holded || el_key.classList.contains('holded'))
        }
        return is_holded
    }

    private __fixWinAltgr (code, state) {
        // https://github.com/pikvm/pikvm/issues/375
        // https://github.com/novnc/noVNC/blob/84f102d6/core/input/keyboard.js
        if (state) {
            if (this.__altgr_ctrl_timer) {
                clearTimeout(this.__altgr_ctrl_timer)
                this.__altgr_ctrl_timer = null
                if (code !== 'AltRight') {
                    this.emitByCode('ControlLeft', true, false)
                }
            }
            if (code === 'ControlLeft' && !this.__isActive(this.__modifiers['ControlLeft'][0])) {
                this.__altgr_ctrl_timer = setTimeout( () => {
                    this.__altgr_ctrl_timer = null
                    this.emitByCode('ControlLeft', true, false)
                }, 50)
                return false // Stop handling
            }
        } else {
            if (this.__altgr_ctrl_timer) {
                clearTimeout(this.__altgr_ctrl_timer)
                this.__altgr_ctrl_timer = null
                this.emitByCode('ControlLeft', true, false)
            }
        }
        return true // Continue handling
    }

    private __isActive (el_key) {
        let is_active = false
        const el_keys = this.__resolveKeys(el_key)
        for (el_key of el_keys) {
            is_active = (is_active || el_key.classList.contains('pressed') || el_key.classList.contains('holded'))
        }
        return is_active
    }

    private __activate (el_key, cls) {
        const el_keys = this.__resolveKeys(el_key)
        for (el_key of el_keys) {
            el_key.classList.add(cls)
        }
    }

    private __deactivate (el_key) {
        const el_keys = this.__resolveKeys(el_key)
        for (el_key of el_keys) {
            el_key.classList.remove('pressed')
            el_key.classList.remove('holded')
        }
    }

    private __resolveKeys (el_key) {
        const code = el_key.getAttribute('data-code')
        return this.__merged[code]
    }

    private  __fixMacCmd (code, state) {
        log('fixMacCmd', code, state)
        if ((code == 'MetaLeft' || code == 'MetaRight') && !state) {
            for (code in this.__keys) {
                if (this.__isActive(this.__keys[code][0])) {
                    this.emitByCode(code, false, false)
                }
            }
        }
    }

    private __commonHandler (el_key, state, hold) {
        if (state && !this.__isActive(el_key)) {
            this.__deactivate(el_key)
            this.__activate(el_key, (hold ? 'holded' : 'pressed'))
            this.__process(el_key, true)
        } else {
            this.__deactivate(el_key)
            this.__process(el_key, false)
        }
    }

    
    private __process (el_key, state) {
        const code = el_key.getAttribute('data-code')
        this.__sendKey(code, state)
    }

}