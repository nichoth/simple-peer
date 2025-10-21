import bowser from 'bowser'
import { Test } from '@substrate-system/tapzero'

// create a test MediaStream with two tracks
let canvas:HTMLCanvasElement|undefined
export function getMediaStream ():MediaStream|object {
    if (typeof (window) === 'undefined') return {}

    if (!canvas) {
        canvas = document.createElement('canvas')
        canvas.width = canvas.height = 100
        canvas.getContext('2d') // initialize canvas
    }
    const stream = canvas.captureStream(30)
    stream.addTrack(stream.getTracks()[0].clone()) // should have 2 tracks
    return stream
}

export function isBrowser (name:string):boolean {
    if (typeof (window) === 'undefined') return false
    const satifyObject:any = {}
    if (name === 'ios') { // bowser can't directly name iOS Safari
        satifyObject.mobile = { safari: '>=0' }
    } else {
        satifyObject[name] = '>=0'
    }

    return !!bowser.getParser(window.navigator.userAgent).satisfies(satifyObject)
}

// Extend tapzero Test with additional methods for tape compatibility

// Add pass() method
if (!Test.prototype.pass) {
    Test.prototype.pass = function (msg?: string) {
        this.ok(true, msg || 'pass')
    }
}

// Add end() method
if (!Test.prototype.end) {
    Test.prototype.end = function () {
        // If no plan was set, resolve immediately
        if (this._planned === null) {
            this._planned = this._actual
            if (this._resolve) {
                this._resolve()
            }
        }
    }
}

// Add timeoutAfter() method
if (!Test.prototype.timeoutAfter) {
    Test.prototype.timeoutAfter = function (ms: number) {
        this.TIMEOUT_MS = ms
    }
}

export default {
    isBrowser,
    getMediaStream
}
