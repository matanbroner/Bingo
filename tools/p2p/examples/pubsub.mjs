import Libp2p from "libp2p";
import WStar from "libp2p-webrtc-star";
import Websockets from "libp2p-websockets";
import Boostrap from "libp2p-bootstrap";
import { NOISE } from "libp2p-noise";
import MPLEX from "libp2p-mplex";
import multiaddr from "multiaddr";

(async () => {
  const libp2p = await Libp2p.create({
    addresses: {
      // add a listen address (localhost) to accept TCP connections on a random port
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    modules: {
      transport: [Websockets, WStar],
      connEncryption: [NOISE],
      streamMuxer: [MPLEX],
      peerDiscovery: [Boostrap],
    },
    config: {
      peerDiscovery: {
        bootstrap: {
          enabled: true,
          list: [
            "/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd",
            "/dns4/lon-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3",
            "/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM",
            "/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu",
            "/dns4/nyc-1.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm",
            "/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/p2p/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64",
          ],
        },
      },
    },
  });
  await libp2p.start();
  libp2p.multiaddrs.push(
    multiaddr("/ip4/0.0.0.0/tcp/13579/wss/p2p-webrtc-star")
  );
})();
