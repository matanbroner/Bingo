const Hyperswarm = require("hyperswarm");
const topics = require("../../relay/src/topics");

const SECOND = 1000;

module.exports = async () => {
  const swarm = new Hyperswarm();
  const topic = Buffer.alloc(32).fill(topics.SHARE_SECRET); // A topic must be 32 bytes

  const discovery = swarm.join(topic, { server: true, client: false });
  await discovery.flushed(); // Waits for the topic to be fully announced on the DHT

  setInterval(() => {
    const heartbeat = "HEARTBEAT";
    swarm.peers.forEach((peer) => peer.send(heartbeat));
  }, 5 * SECOND);

  swarm.on("connection", (conn, info) => {
    conn.write(`Hello, ${info.publicKey.toString("hex")}`);
    conn.end();
  });
};
