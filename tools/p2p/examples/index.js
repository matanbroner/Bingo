const { Broker } = require("../");

(async () => {
  const clientA = new Broker({
    id: "clientA",
  });

  const CHANNEL_NAME = `EXAMPLE`;

  clientA.logger.info(`Connecting to channel: ${CHANNEL_NAME}`);

  const channelA = await clientA.channel(CHANNEL_NAME);

  channelA.on("peer-join", () => {
    console.log("Client A saw peer");
    channelA.broadcast("Hey, I'm Client A");
  });

  setTimeout(async () => {
    const clientB = new Broker({
      id: "clientB",
    });
    const channelB = await clientB.channel(CHANNEL_NAME);
    channelB.on("peer-join", () => {
      console.log("Client A saw peer");
      channelB.broadcast("Hey, I'm Client B");
    });
  }, 1000);

})();
