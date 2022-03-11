const WSS = require("ws").Server;
const uuidV4 = require("uuid").v4;
const MemoryCache = require("./cache").memory;
const { decodePayloadById } = require("../crypto");

const generateMessageId = () => uuidV4();

const send = (ws, message) => {
  ws.send(
    JSON.stringify({
      ...message,
      messageId: generateMessageId(),
    })
  );
};

const identifyUserWs = async (wss, ws, json) => {
  // TODO: user should send a message with their id and the body of the message signed by their private key
  // ... the server should verify the signature and set the websocket to identify the user
  // ... for now we just blindly accept the messages
  // ... user MUST pass the id of their device
  const { messageId, data } = json;
  const { id, payload } = data;
  try {
    let decoded = await decodePayloadById(id, payload);
    global.logger.debug(`Decoded payload: ${decoded}`);
    decoded = JSON.parse(decoded);
    if (!decoded.deviceId) {
      throw new Error("Invalid payload");
    }
    ws._userId = id;
    let client = wss.cache.get(id);
    if (client) {
      client.ws = ws;
      client.active = true;
      global.logger.info(
        `Client ${id} reconnected, now connected to ${ws._id}`
      );
    } else {
      global.logger.info(`Client ${id} connected to ${ws._id}`);
      wss.cache.set(id, {
        ws,
        active: true,
        user: id,
        devices: new Set(),
      });
      client = wss.cache.get(id);
    }
    if (!client.devices.has(decoded.deviceId)) {
      client.devices.add(decoded.deviceId);
    } else {
      global.logger.info(
        `Client ${id} already connected to ${decoded.deviceId}`
      );
    }
    send(ws, {
      replyId: messageId,
      type: "success",
      data: null,
    });
  } catch (e) {
    send(ws, {
      replyId: messageId,
      type: "error",
      error: e.message,
    });
    global.logger.error(e);
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
    send(ws, {
      type: "id",
      id: ws._id,
    });

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      switch (data.type) {
        case "echo":
          send(ws, {
            replyId: data.messageId,
            type: "echo",
            data: "OK",
          });
          break;
        case "identify":
          identifyUserWs(wss, ws, data);
          break;
        default:
          break;
      }
    });

    ws.on("close", () => {
      // TODO: should the user be purged from cache?
      // ... does that require the 4-way handshake each time a reconnection is attempted?
      // ... figure out a better scheme to index cache, perhaps by userId, and purge after a certain time -
      // ... if no new websocket is added.
      global.logger.info(`Client ${ws._id} disconnected`);
      // find the client in the cache
      wss.cache.get(ws._userId).active = false;
    });
  });
};
