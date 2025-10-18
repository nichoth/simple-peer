import bowser from 'bowser'

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

export default {
    isBrowser,
    getMediaStream
}
