// Browser-specific MediaStream tests
import Peer from '../../src/index.js'
import test, { type Test } from 'tape'

// Helper to create a test MediaStream with canvas
function createMediaStream ():MediaStream {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 100
    canvas.getContext('2d') // initialize canvas
    const stream = (canvas as any).captureStream(30)
    stream.addTrack(stream.getTracks()[0].clone()) // add 2 tracks
    return stream
}

test('browser: two peers can exchange media streams', function (t:Test) {
    t.plan(6)
    t.timeoutAfter(20000)

    const stream1 = createMediaStream()
    const stream2 = createMediaStream()

    const peer1 = new Peer({ initiator: true, stream: stream1 })
    const peer2 = new Peer({ stream: stream2 })

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', () => t.pass('peer1 connected'))
    peer2.on('connect', () => t.pass('peer2 connected'))

    peer1.on('stream', receivedStream => {
        t.ok(receivedStream instanceof MediaStream, 'peer1 received MediaStream')
        t.ok(receivedStream.getTracks().length >= 1, 'stream has tracks')
    })

    peer2.on('stream', receivedStream => {
        t.ok(receivedStream instanceof MediaStream, 'peer2 received MediaStream')
        t.ok(receivedStream.getTracks().length >= 1, 'stream has tracks')

        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
        }, 100)
    })
})

test('browser: two peers can add streams after connection', function (t:Test) {
    t.plan(4)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        t.pass('peer1 connected')
        // Add stream after connection
        const stream = createMediaStream()
        peer1.addStream(stream)
    })

    peer2.on('connect', function () {
        t.pass('peer2 connected')
    })

    peer2.on('stream', receivedStream => {
        t.ok(receivedStream instanceof MediaStream, 'peer2 received stream')
        t.ok(receivedStream.getTracks().length >= 1, 'stream has tracks')

        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
        }, 100)
    })
})

test('browser: two peers receive track events', function (t:Test) {
    t.plan(6)
    t.timeoutAfter(20000)

    const stream1 = createMediaStream()
    const stream2 = createMediaStream()

    const peer1 = new Peer({ initiator: true, stream: stream1 })
    const peer2 = new Peer({ stream: stream2 })

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    let peer1TrackCount = 0
    let peer2TrackCount = 0

    peer1.on('track', (track, stream) => {
        peer1TrackCount++
        t.ok(track instanceof MediaStreamTrack, 'peer1 received MediaStreamTrack')
        t.ok(stream instanceof MediaStream, 'peer1 received stream with track')
    })

    peer2.on('track', (track, stream) => {
        peer2TrackCount++
        t.ok(track instanceof MediaStreamTrack, 'peer2 received MediaStreamTrack')
        t.ok(stream instanceof MediaStream, 'peer2 received stream with track')

        // After receiving tracks, check we got at least one each
        if (peer1TrackCount >= 1 && peer2TrackCount >= 1) {
            setTimeout(() => {
                peer1.destroy()
                peer2.destroy()
            }, 100)
        }
    })
})

test('browser: two peers can send data and stream simultaneously', function (t:Test) {
    t.plan(5)
    t.timeoutAfter(20000)

    const stream = createMediaStream()
    const peer1 = new Peer({ initiator: true, stream })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    let gotStream = false
    let gotData = false

    peer2.on('stream', receivedStream => {
        t.ok(receivedStream instanceof MediaStream, 'received stream')
        gotStream = true
        checkComplete()
    })

    peer2.on('connect', function () {
        t.pass('peer2 connected')
        peer1.send('test message')
    })

    peer2.on('data', data => {
        t.equal(Buffer.from(data).toString(), 'test message', 'received data message')
        gotData = true
        checkComplete()
    })

    function checkComplete () {
        if (gotStream && gotData) {
            t.pass('received both stream and data')
            t.pass('test complete')
            peer1.destroy()
            peer2.destroy()
        }
    }
})

test('browser: peer can remove and add tracks', function (t:Test) {
    t.plan(3)
    t.timeoutAfter(20000)

    const stream = createMediaStream()
    const peer1 = new Peer({ initiator: true, stream })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        t.pass('peer1 connected')

        // Remove a track
        const tracks = stream.getTracks()
        if (tracks.length > 0) {
            peer1.removeTrack(tracks[0], stream)
            t.pass('removed track successfully')
        }

        // Add it back
        if (tracks.length > 0) {
            peer1.addTrack(tracks[0], stream)
            t.pass('added track back successfully')
        }

        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
        }, 1000)
    })
})
