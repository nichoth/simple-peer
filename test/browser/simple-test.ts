// Simple test to verify WebRTC connection works
import Peer from '../../src/index.js'
import { test } from '@substrate-system/tapzero'

test('browser: create peer instances', t => {
    t.plan(4)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    t.ok(peer1, 'peer1 created')
    t.ok(peer2, 'peer2 created')
    t.equal(peer1.initiator, true, 'peer1 is initiator')
    t.equal(peer2.initiator, false, 'peer2 is not initiator')

    peer1.destroy()
    peer2.destroy()
})

test('browser: peers can signal', async t => {
    t.plan(3, 5000)  // 3 assertions, 5 second timeout

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    let peer1GotOffer = false
    let peer2GotAnswer = false

    peer1.on('signal', data => {
        console.log('peer1 signaled:', data.type)
        if (data.type === 'offer' && !peer1GotOffer) {
            peer1GotOffer = true
            t.ok(true, 'peer1 sent offer')
        }
        peer2.signal(data)
    })

    peer2.on('signal', data => {
        console.log('peer2 signaled:', data.type)
        if (data.type === 'answer' && !peer2GotAnswer) {
            peer2GotAnswer = true
            t.ok(true, 'peer2 sent answer')
        }
        peer1.signal(data)
    })

    await new Promise<void>(resolve => {
        setTimeout(() => {
            t.ok(peer1GotOffer && peer2GotAnswer, 'both peers completed signaling')
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 1000)
    })
})

test('browser: peers exchange offer and answer', async t => {
    t.plan(4, 3000)

    const peer1 = new Peer({ initiator: true })
    const peer2 = new Peer()

    let gotOffer = false
    let gotAnswer = false
    let peer1Candidates = 0
    let peer2Candidates = 0

    peer1.on('signal', data => {
        if (data.type === 'offer') {
            gotOffer = true
            t.ok(data.sdp, 'peer1 sent offer with SDP')
        }
        if (data.candidate) {
            peer1Candidates++
        }
        peer2.signal(data)
    })

    peer2.on('signal', data => {
        if (data.type === 'answer') {
            gotAnswer = true
            t.ok(data.sdp, 'peer2 sent answer with SDP')
        }
        if (data.candidate) {
            peer2Candidates++
        }
        peer1.signal(data)
    })

    await new Promise<void>(resolve => {
        setTimeout(() => {
            t.ok(gotOffer && gotAnswer, 'completed SDP exchange')
            t.ok(peer1Candidates > 0 && peer2Candidates > 0, 'exchanged ICE candidates')
            peer1.destroy()
            peer2.destroy()
            resolve()
        }, 1000)
    })
})

// Note: Full WebRTC connection tests (connect/data events) don't work in
// headless browsers. Run `npm run test:browser:local` with a headed browser
// for complete connection testing.
