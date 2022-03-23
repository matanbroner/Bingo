import { signallingServer } from 'libp2p-webrtc-star'

const server = await signallingServer({
  port: 24642,
  host: '0.0.0.0',
  metrics: false
})

// some time later
await server.stop()