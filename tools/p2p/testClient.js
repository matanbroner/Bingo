const Hyperswarm = require("hyperswarm");
const topics = require("../topics");

const coinToss = () => Math.random() > 0.5;

(async () => {
  const swarm = new Hyperswarm();
  const topic = Buffer.alloc(32).fill(topics.SHARE_SECRET); // A topic must be 32 bytes

  const discovery = swarm.join(topic, { server: false, client: true });
  await discovery.flushed(); // Waits for the topic to be fully announced on the DHT

  swarm.on("connection", (conn, info) => {
    // swarm1 will receive server connections
    console.log(`Connected to server: ${info.publicKey.toString("hex")}`);
    conn.on("data", (data) => console.log("Got message:", data.toString()));

    if (coinToss()) {
      setTimeout(() => {
        console.log("Leaving topic...");
        conn.write("Bye, server");
        conn.end();
        swarm.leave(topic);
      }, 5 * 1000);
    }
  });
})();
