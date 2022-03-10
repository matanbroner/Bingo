const WSS = require("ws").Server;
const uuidV4 = require("uuid").v4;
const MemoryCache = require("./cache").memory;

const generateMessageId = () => uuidV4();

const identifyUserWs = async (wss, ws, json) => {
  // TODO: user should send a message with their id and the body of the message signed by their private key
  // ... the server should verify the signature and set the websocket to identify the user
  // ... for now we just blindly accept the messages
  // ... user MUST pass the id of their device
  const { messageId, data } = json;
  const { id, payload } = data;
  console.log("identifyUserWs", data);
  try {
    const decoded = payload; // await decodePayloadById(id, payload)
    let client = wss.cache.get(ws._id);
    if (!client) {
      // TODO: decide what to do if client is not found
      // ... could this be due to a client getting purged from cache?
      // ... for now we throw an error
      throw new Error(`Client ${ws._id} not found`);
    }
    client.user = id;
    if (!decoded.deviceId) {
      throw new Error("Missing deviceId");
    }
    client.devices.add(decoded.deviceId);
    wss.cache.set(ws._id, client);
    ws.send(
      JSON.stringify({
        messageId: generateMessageId(),
        replyId: messageId,
        type: "success",
        data: null
      })
    );
  } catch (e) {
    ws.send(
      JSON.stringify({
        messageId: generateMessageId(),
        replyId: messageId,
        type: "error",
        error: e.message,
      })
    );
    console.error(e);
  }
};

module.exports = (options) => {
  const { server } = options;
  const wss = new WSS({
    server,
  });
  wss.cache = new MemoryCache();

  wss.on("connection", (ws) => {
    // Assign a unique ID to the client
    ws._id = uuidV4();
    wss.cache.set(ws._id, {
      ws,
      active: true,
      user: null,
      devices: new Set(),
    });
    ws.send(
      JSON.stringify({
        messageId: generateMessageId(),
        type: "id",
        id: ws._id,
      })
    );

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      switch (data.type) {
        case "echo":
          ws.send(
            JSON.stringify({
              messageId: generateMessageId(),
              replyId: data.messageId,
              type: "echo",
              data: "OK",
            })
          );
          break;
        case "identify":
          identifyUserWs(wss, ws, data);
          break;
        default:
          break;
      }
    });
  });
};
