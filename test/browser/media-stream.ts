// Browser-specific MediaStream tests
import Peer from '../../src/index.js'
import { test } from '@substrate-system/tapzero'

// Helper to create a test MediaStream with canvas
function createMediaStream ():MediaStream {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 100
    canvas.getContext('2d') // initialize canvas
    const stream = (canvas as any).captureStream(30)
    stream.addTrack(stream.getTracks()[0].clone()) // add 2 tracks
    return stream
}

test('browser: two peers can exchange media streams', async t => {
    t.plan(6, 20000)  // 6 assertions, 20 second timeout

    const stream1 = createMediaStream()
    const stream2 = createMediaStream()

    const peer1 = new Peer({ initiator: true, stream: stream1 })
    const peer2 = new Peer({ stream: stream2 })

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', () => t.ok(true, 'peer1 connected'))
    peer2.on('connect', () => t.ok(true, 'peer2 connected'))

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

    await new Promise<void>(resolve => {
        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 15000)
    })
})

test('browser: two peers can add streams after connection', async t => {
    t.plan(4, 20000)  // 4 assertions, 20 second timeout

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        t.ok(true, 'peer1 connected')
        // Add stream after connection
        const stream = createMediaStream()
        peer1.addStream(stream)
    })

    peer2.on('connect', function () {
        t.ok(true, 'peer2 connected')
    })

    peer2.on('stream', receivedStream => {
        t.ok(receivedStream instanceof MediaStream, 'peer2 received stream')
        t.ok(receivedStream.getTracks().length >= 1, 'stream has tracks')

        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
        }, 100)
    })

    await new Promise<void>(resolve => {
        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 15000)
    })
})

test('browser: two peers receive track events', async t => {
    t.plan(6, 20000)  // 6 assertions, 20 second timeout

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

    await new Promise<void>(resolve => {
        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 15000)
    })
})

test('browser: two peers can send data and stream simultaneously', async t => {
    t.plan(5, 20000)  // 5 assertions, 20 second timeout

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
        t.ok(true, 'peer2 connected')
        peer1.send('test message')
    })

    peer2.on('data', data => {
        t.equal(Buffer.from(data).toString(), 'test message', 'received data message')
        gotData = true
        checkComplete()
    })

    function checkComplete () {
        if (gotStream && gotData) {
            t.ok(true, 'received both stream and data')
            t.ok(true, 'test complete')
            peer1.destroy()
            peer2.destroy()
        }
    }

    await new Promise<void>(resolve => {
        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 15000)
    })
})

test('browser: peer can remove and add tracks', async t => {
    t.plan(3, 20000)  // 3 assertions, 20 second timeout

    const stream = createMediaStream()
    const peer1 = new Peer({ initiator: true, stream })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        t.ok(true, 'peer1 connected')

        // Remove a track
        const tracks = stream.getTracks()
        if (tracks.length > 0) {
            peer1.removeTrack(tracks[0], stream)
            t.ok(true, 'removed track successfully')
        }

        // Add it back
        if (tracks.length > 0) {
            peer1.addTrack(tracks[0], stream)
            t.ok(true, 'added track back successfully')
        }

        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
        }, 1000)
    })

    await new Promise<void>(resolve => {
        setTimeout(() => {
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 15000)
    })
})
