import common from './common.js'
import Peer from '../src/index.js'
import { test } from '@substrate-system/tapzero'

test('multistream', function (t) {
    if (!process.browser) return t.end()
    if (common.isBrowser('ios')) {
        t.pass('Skip on iOS emulator which does not support this reliably') // iOS emulator issue #486
        t.end()
        return
    }
    t.plan(20)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,
        streams: (new Array(10)).fill(null).map(function () { return common.getMediaStream() })
    })
    const peer2 = new Peer({
        streams: (new Array(10)).fill(null).map(function () { return common.getMediaStream() })
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    const receivedIds:Record<string, boolean> = {}

    peer1.on('stream', function (stream) {
        t.pass('peer1 got stream')
        if (receivedIds[stream.id]) {
            t.fail('received one unique stream per event')
        } else {
            receivedIds[stream.id] = true
        }
    })
    peer2.on('stream', function (stream) {
        t.pass('peer2 got stream')
        if (receivedIds[stream.id]) {
            t.fail('received one unique stream per event')
        } else {
            receivedIds[stream.id] = true
        }
    })
})

test('multistream (track event)', function (t) {
    if (!process.browser) return t.end()
    t.plan(20)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,

        streams: (new Array(5)).fill(null).map(function () { return common.getMediaStream() })
    })
    const peer2 = new Peer({

        streams: (new Array(5)).fill(null).map(function () { return common.getMediaStream() })
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    const receivedIds:Record<string, boolean> = {}

    peer1.on('track', function (track) {
        t.pass('peer1 got track')
        if (receivedIds[track.id]) {
            t.fail('received one unique track per event')
        } else {
            receivedIds[track.id] = true
        }
    })
    peer2.on('track', function (track) {
        t.pass('peer2 got track')
        if (receivedIds[track.id]) {
            t.fail('received one unique track per event')
        } else {
            receivedIds[track.id] = true
        }
    })
})

test('multistream on non-initiator only', function (t) {
    if (!process.browser) return t.end()
    t.plan(30)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,
        streams: []
    })
    const peer2 = new Peer({

        streams: (new Array(10)).fill(null).map(function () { return common.getMediaStream() })
    })

    peer1.on('signal', function (data) {
        if (data.transceiverRequest) t.pass('got transceiverRequest')
        if (!peer2.destroyed) peer2.signal(data)
    })
    peer2.on('signal', function (data) {
        if (data.transceiverRequest) t.pass('got transceiverRequest')
        if (!peer1.destroyed) peer1.signal(data)
    })

    const receivedIds:Record<string, boolean> = {}

    peer1.on('stream', function (stream) {
        t.pass('peer1 got stream')
        if (receivedIds[stream.id]) {
            t.fail('received one unique stream per event')
        } else {
            receivedIds[stream.id] = true
        }
    })
})

test('delayed stream on non-initiator', function (t) {
    if (!process.browser) return t.end()
    if (common.isBrowser('ios')) {
        t.pass('Skip on iOS which does not support this reliably')
        t.end()
        return
    }
    t.plan(1)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        trickle: true,
        initiator: true,

        streams: [common.getMediaStream()]
    })
    const peer2 = new Peer({
        trickle: true,
        streams: []
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    setTimeout(() => {
        peer2.addStream(common.getMediaStream() as MediaStream)
    }, 10000)
    peer1.on('stream', function () {
        t.pass('peer1 got stream')
    })
})

test('incremental multistream', function (t) {
    if (!process.browser) return t.end()
    if (common.isBrowser('ios')) {
        t.pass('Skip on iOS emulator which does not support this reliably') // iOS emulator issue #486
        t.end()
        return
    }
    t.plan(12)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,
        streams: []
    })
    const peer2 = new Peer({
        streams: []
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
        peer1.addStream(common.getMediaStream() as MediaStream)
    })
    peer2.on('connect', function () {
        t.pass('peer2 connected')
        peer2.addStream(common.getMediaStream() as MediaStream)
    })

    const receivedIds:Record<string, boolean> = {}

    let count1 = 0
    peer1.on('stream', function (stream) {
        t.pass('peer1 got stream')
        if (receivedIds[stream.id]) {
            t.fail('received one unique stream per event')
        } else {
            receivedIds[stream.id] = true
        }
        count1++
        if (count1 < 5) {
            peer1.addStream(common.getMediaStream() as MediaStream)
        }
    })

    let count2 = 0
    peer2.on('stream', function (stream) {
        t.pass('peer2 got stream')
        if (receivedIds[stream.id]) {
            t.fail('received one unique stream per event')
        } else {
            receivedIds[stream.id] = true
        }
        count2++
        if (count2 < 5) {
            peer2.addStream(common.getMediaStream() as MediaStream)
        }
    })
})

test('incremental multistream (track event)', function (t) {
    if (!process.browser) return t.end()
    t.plan(22)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,
        streams: []
    })
    const peer2 = new Peer({
        streams: []
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
        peer1.addStream(common.getMediaStream() as MediaStream)
    })
    peer2.on('connect', function () {
        t.pass('peer2 connected')
        peer2.addStream(common.getMediaStream() as MediaStream)
    })

    const receivedIds:Record<string, boolean> = {}

    let count1 = 0
    peer1.on('track', function (track) {
        t.pass('peer1 got track')
        if (receivedIds[track.id]) {
            t.fail('received one unique track per event')
        } else {
            receivedIds[track.id] = true
        }
        count1++
        if (count1 % 2 === 0 && count1 < 10) {
            peer1.addStream(common.getMediaStream() as MediaStream)
        }
    })

    let count2 = 0
    peer2.on('track', function (track) {
        t.pass('peer2 got track')
        if (receivedIds[track.id]) {
            t.fail('received one unique track per event')
        } else {
            receivedIds[track.id] = true
        }
        count2++
        if (count2 % 2 === 0 && count2 < 10) {
            peer2.addStream(common.getMediaStream() as MediaStream)
        }
    })
})

test('incremental multistream on non-initiator only', function (t) {
    if (!process.browser) return t.end()
    if (common.isBrowser('ios')) {
        t.pass('Skip on iOS emulator which does not support this reliably') // iOS emulator issue #486
        t.end()
        return
    }
    t.plan(7)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,
        streams: []
    })
    const peer2 = new Peer({
        streams: []
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
    })
    peer2.on('connect', function () {
        t.pass('peer2 connected')
        peer2.addStream(common.getMediaStream() as MediaStream)
    })

    const receivedIds:Record<string, boolean> = {}

    let count = 0
    peer1.on('stream', function (stream) {
        t.pass('peer1 got stream')
        if (receivedIds[stream.id]) {
            t.fail('received one unique stream per event')
        } else {
            receivedIds[stream.id] = true
        }
        count++
        if (count < 5) {
            peer2.addStream(common.getMediaStream() as MediaStream)
        }
    })
})

test('incremental multistream on non-initiator only (track event)', function (t) {
    if (!process.browser) return t.end()
    t.plan(12)
    t.timeoutAfter(20000)

    const peer1 = new Peer({
        initiator: true,
        streams: []
    })
    const peer2 = new Peer({
        streams: []
    })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
    })
    peer2.on('connect', function () {
        t.pass('peer2 connected')
        peer2.addStream(common.getMediaStream() as MediaStream)
    })

    const receivedIds:Record<string, boolean> = {}

    let count = 0
    peer1.on('track', function (track) {
        t.pass('peer1 got track')
        if (receivedIds[track.id]) {
            t.fail('received one unique track per event')
        } else {
            receivedIds[track.id] = true
        }
        count++
        if (count % 2 === 0 && count < 10) {
            peer2.addStream(common.getMediaStream() as MediaStream)
        }
    })
})

test('addStream after removeStream', function (t) {
    if (!process.browser) return t.end()
    if (common.isBrowser('ios')) {
        t.pass('Skip on iOS which does not support this reliably')
        t.end()
        return
    }
    t.plan(2)
    t.timeoutAfter(20000)

    const stream1 = common.getMediaStream() as MediaStream
    const stream2 = common.getMediaStream() as MediaStream

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer({ streams: [stream1] })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    peer1.once('stream', () => {
        t.pass('peer1 got first stream')
        peer2.removeStream(stream1)
        setTimeout(() => {
            peer1.once('stream', () => {
                t.pass('peer1 got second stream')
            })
            peer2.addStream(stream2)
        }, 1000)
    })
})

test('removeTrack immediately', function (t) {
    if (!process.browser) return t.end()
    t.plan(2)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer({ })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    const stream1 = common.getMediaStream() as MediaStream
    const stream2 = common.getMediaStream() as MediaStream

    peer1.addTrack(stream1.getTracks()[0], stream1)
    peer2.addTrack(stream2.getTracks()[0], stream2)

    peer1.removeTrack(stream1.getTracks()[0], stream1)
    peer2.removeTrack(stream2.getTracks()[0], stream2)

    peer1.on('track', function (_track, _stream) {
        t.fail('peer1 did not get track event')
    })
    peer2.on('track', function (_track, _stream) {
        t.fail('peer2 did not get track event')
    })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
    })
    peer2.on('connect', function () {
        t.pass('peer2 connected')
    })
})

test('replaceTrack', function (t) {
    if (!process.browser) return t.end()
    t.plan(4)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer({ })

    peer1.on('signal', function (data) { if (!peer2.destroyed) peer2.signal(data) })
    peer2.on('signal', function (data) { if (!peer1.destroyed) peer1.signal(data) })

    const stream1 = common.getMediaStream() as MediaStream
    const stream2 = common.getMediaStream() as MediaStream

    peer1.addTrack(stream1.getTracks()[0], stream1)
    peer2.addTrack(stream2.getTracks()[0], stream2)

    peer1.replaceTrack(stream1.getTracks()[0], stream2.getTracks()[0], stream1)
    peer2.replaceTrack(stream2.getTracks()[0], stream1.getTracks()[0], stream2)

    peer1.on('track', function (_track, _stream) {
        t.pass('peer1 got track event')
        peer2.replaceTrack(stream2.getTracks()[0], null, stream2)
    })
    peer2.on('track', function (_track, _stream) {
        t.pass('peer2 got track event')
        peer1.replaceTrack(stream1.getTracks()[0], null, stream1)
    })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
    })
    peer2.on('connect', function () {
        t.pass('peer2 connected')
    })
})
