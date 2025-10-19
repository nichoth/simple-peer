// @ts-check
import common from './common.js'
import Peer from '../src/index.js'
import test, { type Test } from 'tape'

// User-Initiated Abort, reason=Close called
process.on('uncaughtException', console.error)

test('detect WebRTC support', function (t:Test) {
    t.equal(Peer.WEBRTC_SUPPORT, true, 'builtin webrtc support')
    t.end()
})

test('create peer without options', function (t:Test) {
    t.plan(1)

    let peer:Peer
    t.doesNotThrow(function () {
        peer = new Peer()
        peer.destroy()
    })
})

test('signal event gets emitted', function (t:Test) {
    t.plan(2)

    const peer = new Peer({ initiator: true })
    peer.once('signal', function () {
        t.pass('got signal event')
        peer.on('close', function () { t.pass('peer destroyed') })
        peer.destroy()
    })
})

test('signal event does not get emitted by non-initiator', function (t:Test) {
    const peer = new Peer({ initiator: false })
    peer.once('signal', function () {
        t.fail('got signal event')
        peer.on('close', function () { t.pass('peer destroyed') })
        peer.destroy()
    })

    setTimeout(() => {
        t.pass('did not get signal after 1000ms')
        t.end()
    }, 1000)
})

// test('signal event does not get emitted by non-initiator with stream', function (t) {
//   const peer = new Peer({
//
//     stream: common.getMediaStream(),
//     initiator: false
//   })
//   peer.once('signal', function () {
//     t.fail('got signal event')
//     peer.on('close', function () { t.pass('peer destroyed') })
//     peer.destroy()
//   })

//   setTimeout(() => {
//     t.pass('did not get signal after 1000ms')
//     t.end()
//   }, 1000)
// })

test('two peers can exchange text messages', function (t:Test) {
    if (!process.browser) return t.end()
    t.plan(8)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    // Wire up signaling between peers
    peer1.on('signal', function (data) {
        peer2.signal(data)
    })

    peer2.on('signal', function (data) {
        peer1.signal(data)
    })

    // Wait for both peers to connect
    let peer1Connected = false
    let peer2Connected = false

    peer1.on('connect', function () {
        peer1Connected = true
        t.pass('peer1 connected')
        tryTest()
    })

    peer2.on('connect', function () {
        peer2Connected = true
        t.pass('peer2 connected')
        tryTest()
    })

    function tryTest () {
        if (!peer1Connected || !peer2Connected) return

        t.equal(peer1.initiator, true, 'peer1 is initiator')
        t.equal(peer2.initiator, false, 'peer2 is not initiator')

        // Test peer1 -> peer2 message
        peer1.send('Hello from peer1')
        peer2.once('data', function (data) {
            t.equal(Buffer.from(data).toString(), 'Hello from peer1', 'peer2 received correct message from peer1')

            // Test peer2 -> peer1 message
            peer2.send('Hello from peer2')
            peer1.once('data', function (data) {
                t.equal(Buffer.from(data).toString(), 'Hello from peer2', 'peer1 received correct message from peer2')

                cleanup()
            })
        })
    }

    function cleanup () {
        peer1.on('close', function () { t.pass('peer1 destroyed') })
        peer1.destroy()
        peer2.on('close', function () { t.pass('peer2 destroyed') })
        peer2.destroy()
    }
})

test('two peers can exchange multiple messages', function (t:Test) {
    if (!process.browser) return t.end()
    t.plan(8)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    // Wire up signaling
    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    const peer1Messages:string[] = []
    const peer2Messages:string[] = []

    peer1.on('data', function (data) {
        peer1Messages.push(Buffer.from(data).toString())
    })

    peer2.on('data', function (data) {
        peer2Messages.push(Buffer.from(data).toString())
    })

    peer1.on('connect', function () {
        t.pass('peer1 connected')
        peer2.on('connect', function () {
            t.pass('peer2 connected')

            // Send multiple messages from each peer
            peer1.send('message1 from peer1')
            peer1.send('message2 from peer1')
            peer1.send('message3 from peer1')

            peer2.send('message1 from peer2')
            peer2.send('message2 from peer2')
            peer2.send('message3 from peer2')

            // Wait a bit for messages to arrive
            setTimeout(function () {
                t.equal(peer2Messages.length, 3, 'peer2 received 3 messages')
                t.equal(peer2Messages[0], 'message1 from peer1', 'peer2 got first message')
                t.equal(peer2Messages[1], 'message2 from peer1', 'peer2 got second message')
                t.equal(peer2Messages[2], 'message3 from peer1', 'peer2 got third message')

                t.equal(peer1Messages.length, 3, 'peer1 received 3 messages')
                t.equal(peer1Messages[0], 'message1 from peer2', 'peer1 got first message')

                peer1.destroy()
                peer2.destroy()
            }, 1000)
        })
    })
})

test('two peers can exchange binary data', function (t:Test) {
    if (!process.browser) return t.end()
    t.plan(6)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        t.pass('peer1 connected')
    })

    peer2.on('connect', function () {
        t.pass('peer2 connected')
        testBinaryData()
    })

    function testBinaryData () {
        // Create binary data
        const binaryData = new Uint8Array([1, 2, 3, 4, 5])

        peer1.send(binaryData)
        peer2.once('data', function (data) {
            t.ok(ArrayBuffer.isView(data), 'received data is ArrayBufferView')
            const received = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
            t.equal(received.length, 5, 'received correct length')
            t.deepEqual(Array.from(received), [1, 2, 3, 4, 5], 'received correct binary data')

            peer2.send(new Uint8Array([10, 20, 30]))
            peer1.once('data', function (data) {
                const received = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                t.deepEqual(Array.from(received), [10, 20, 30], 'peer1 received correct binary data')

                peer1.destroy()
                peer2.destroy()
            })
        })
    }
})

test('sdpTransform function is called', function (t:Test) {
    if (!process.browser) return t.end()
    t.plan(3)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer({ sdpTransform })

    function sdpTransform (sdp:string):string {
        t.equal(typeof sdp, 'string', 'got a string as SDP')
        setTimeout(function () {
            peer1.on('close', function () { t.pass('peer1 destroyed') })
            peer1.destroy()
            peer2.on('close', function () { t.pass('peer2 destroyed') })
            peer2.destroy()
        }, 0)

        return sdp
    }

    peer1.on('signal', function (data) {
        peer2.signal(data)
    })

    peer2.on('signal', function (data) {
        peer1.signal(data)
    })
})

test('old constraint formats are used', function (t:Test) {
    if (!process.browser) return t.end()
    t.plan(3)
    t.timeoutAfter(20000)

    const constraints = {
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    }

    const peer1 = new Peer({ initiator: true, constraints })
    const peer2 = new Peer({ constraints })

    peer1.on('signal', function (data) {
        peer2.signal(data)
    })

    peer2.on('signal', function (data) {
        peer1.signal(data)
    })

    peer1.on('connect', function () {
        t.pass('peers connected')
        peer1.on('close', function () { t.pass('peer1 destroyed') })
        peer1.destroy()
        peer2.on('close', function () { t.pass('peer2 destroyed') })
        peer2.destroy()
    })
})

test('new constraint formats are used', function (t:Test) {
    if (!process.browser) return t.end()
    t.plan(3)
    t.timeoutAfter(20000)

    const constraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    }

    const peer1 = new Peer({ initiator: true, constraints })
    const peer2 = new Peer({ constraints })

    peer1.on('signal', function (data) {
        peer2.signal(data)
    })

    peer2.on('signal', function (data) {
        peer1.signal(data)
    })

    peer1.on('connect', function () {
        t.pass('peers connected')
        peer1.on('close', function () { t.pass('peer1 destroyed') })
        peer1.destroy()
        peer2.on('close', function () { t.pass('peer2 destroyed') })
        peer2.destroy()
    })
})

test('ensure remote address and port are available right after connection', function (t:Test) {
    if (!process.browser) return t.end()
    if (common.isBrowser('safari') || common.isBrowser('ios')) {
        t.pass('Skip on Safari and iOS which do not support modern getStats() calls')
        t.end()
        return
    }
    if (common.isBrowser('chrome') || common.isBrowser('edge')) {
        t.pass('Skip on Chrome and Edge which hide local IPs with mDNS')
        t.end()
        return
    }

    t.plan(7)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    peer1.on('signal', function (data) {
        peer2.signal(data)
    })

    peer2.on('signal', function (data) {
        peer1.signal(data)
    })

    peer1.on('connect', function () {
        t.pass('peers connected')

        t.ok(peer1.remoteAddress, 'peer1 remote address is present')
        t.ok(peer1.remotePort, 'peer1 remote port is present')

        peer2.on('connect', function () {
            t.ok(peer2.remoteAddress, 'peer2 remote address is present')
            t.ok(peer2.remotePort, 'peer2 remote port is present')

            peer1.on('close', function () { t.pass('peer1 destroyed') })
            peer1.destroy()
            peer2.on('close', function () { t.pass('peer2 destroyed') })
            peer2.destroy()
        })
    })
})

test('ensure iceStateChange fires when connection failed', (t) => {
    t.plan(1)
    const peer = new Peer({ initiator: true })

    peer.once('iceStateChange', () => {
        t.pass('got iceStateChange')
        t.end()
    })

    // simulate concurrent iceConnectionStateChange and destroy()
    peer.destroy()
    peer!._pc!.oniceconnectionstatechange!(new Event('testing'))
})
