// Browser-specific peer connection tests
import Peer from '../../src/index.js'
import test, { type Test } from 'tape'

test('browser: two peers can connect and exchange messages', function (t:Test) {
    t.plan(6)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    // Add error handlers to diagnose issues
    peer1.on('error', err => {
        console.error('peer1 error:', err)
        t.fail('peer1 error: ' + err.message)
    })
    peer2.on('error', err => {
        console.error('peer2 error:', err)
        t.fail('peer2 error: ' + err.message)
    })

    // Log ICE state changes
    peer1.on('iceStateChange', (iceConnectionState, iceGatheringState) => {
        console.log('peer1 ICE state:', iceConnectionState, iceGatheringState)
    })
    peer2.on('iceStateChange', (iceConnectionState, iceGatheringState) => {
        console.log('peer2 ICE state:', iceConnectionState, iceGatheringState)
    })

    // Wire up signaling
    peer1.on('signal', data => {
        console.log('peer1 signal:', data.type)
        peer2.signal(data)
    })
    peer2.on('signal', data => {
        console.log('peer2 signal:', data.type)
        peer1.signal(data)
    })

    peer1.on('connect', function () {
        console.log('peer1 connected')
        t.pass('peer1 connected')
    })

    peer2.on('connect', function () {
        console.log('peer2 connected')
        t.pass('peer2 connected')

        // Test bidirectional messaging
        peer1.send('Hello from peer1')
        peer2.send('Hello from peer2')
    })

    peer1.on('data', function (data) {
        t.equal(Buffer.from(data).toString(), 'Hello from peer2', 'peer1 received message')
        cleanup()
    })

    peer2.on('data', function (data) {
        t.equal(Buffer.from(data).toString(), 'Hello from peer1', 'peer2 received message')
    })

    function cleanup () {
        peer1.on('close', () => t.pass('peer1 closed'))
        peer2.on('close', () => t.pass('peer2 closed'))
        peer1.destroy()
        peer2.destroy()
    }
})

test('browser: two peers can exchange binary data', function (t:Test) {
    t.plan(5)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        peer2.on('connect', function () {
            t.pass('peers connected')

            // Send binary data
            const binaryData = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC])
            peer1.send(binaryData)

            peer2.once('data', function (data) {
                t.ok(ArrayBuffer.isView(data), 'received ArrayBufferView')
                const received = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                t.deepEqual(
                    Array.from(received),
                    [0xFF, 0xFE, 0xFD, 0xFC],
                    'binary data matches'
                )

                // Test reverse direction
                peer2.send(new Uint8Array([1, 2, 3]))
                peer1.once('data', function (data) {
                    const received = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                    t.deepEqual(Array.from(received), [1, 2, 3], 'reverse binary data matches')

                    t.pass('test complete')
                    peer1.destroy()
                    peer2.destroy()
                })
            })
        })
    })
})

test('browser: two peers can exchange large messages', function (t:Test) {
    t.plan(4)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    peer1.on('signal', data => peer2.signal(data))
    peer2.on('signal', data => peer1.signal(data))

    peer1.on('connect', function () {
        peer2.on('connect', function () {
            t.pass('peers connected')

            // Send large binary data (1MB)
            const largeData = new Uint8Array(1024 * 1024)
            for (let i = 0; i < largeData.length; i++) {
                largeData[i] = i % 256
            }

            peer1.send(largeData)

            peer2.once('data', function (data) {
                t.ok(ArrayBuffer.isView(data), 'received large data')
                const received = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
                t.equal(received.length, 1024 * 1024, 'correct size')
                t.deepEqual(received[1000], 1000 % 256, 'data integrity check')

                peer1.destroy()
                peer2.destroy()
            })
        })
    })
})

test('browser: connection events fire in correct order', function (t:Test) {
    t.plan(4)
    t.timeoutAfter(20000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()
    const events:string[] = []

    peer1.on('signal', data => {
        events.push('peer1-signal')
        peer2.signal(data)
    })

    peer2.on('signal', data => {
        events.push('peer2-signal')
        peer1.signal(data)
    })

    peer1.on('connect', function () {
        events.push('peer1-connect')
        t.ok(events.includes('peer1-signal'), 'peer1 signaled before connect')
    })

    peer2.on('connect', function () {
        events.push('peer2-connect')
        t.ok(events.includes('peer2-signal'), 'peer2 signaled before connect')
        t.ok(events.includes('peer1-connect'), 'peer1 connected')
        t.ok(events.includes('peer2-connect'), 'peer2 connected')

        peer1.destroy()
        peer2.destroy()
    })
})
