const WSS = require("ws").Server;
const uuidV4 = require("uuid").v4;
const _ = require("lodash");
const MemoryCache = require("./cache").memory;
const { decodePayloadById } = require("../crypto");

const generateMessageId = () => uuidV4();

let wss = null;
/*
  Job Structure:
  {
    id: "",
    createdAt: "",
    updatedAt: "",
    completedAt: "",
    type: "",
    data: []
  }
*/
let retrievalJobs = {};

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

const acceptRetrievedData = async (wss, ws, json) => {
  global.logger.debug(`Accepting retrieved data: ${JSON.stringify(json)}`);
};

module.exports = {
  init: (options) => {
    const { server } = options;
    wss = new WSS({
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
          case "retrieved":
            acceptRetrievedData(wss, ws, data);
          default:
            break;
        }
      });

      ws.on("close", () => {
        // TODO: should the user be purged from cache?
        // ... by making the user inactive we prevent the need for another 4-way handshake
        global.logger.info(`Client ${ws._id} disconnected`);
        // find the client in the cache
        if (!ws._userId) {
          return;
        } else {
          wss.cache.get(ws._userId).active = false;
        }
      });
    });
  },
  distribute: (items) => {
    if (!wss) {
      throw new Error("WSS not initialized");
    }
    const activeSockets = wss.cache.active();
    if (activeSockets.length === 0) {
      throw new Error("No active peers");
    }
    // TODO: improve distribution mechanism
    // ... currently we distribute to n random peers
    // ... this later requires querying all peers to retrieve the data
    // ... We choose the number of peers based on a replication factor
    const randomPeers = _.sampleSize(
      activeSockets,
      items.length * process.env.REPLICATION_FACTOR
    );
    // clone the items
    items = Array.from(
      { length: process.env.REPLICATION_FACTOR },
      () => items
    ).flat();
    // give each peer one item
    for (let [_, peer] of randomPeers) {
      const item = items.pop();
      send(peer.ws, {
        type: "distribute",
        data: item,
      });
    }
    // TODO: send items to replication servers
  },
  retrieve: async(query) => {
    if (!wss) {
      throw new Error("WSS not initialized");
    }
    const activeSockets = wss.cache.active();
    if (activeSockets.length === 0) {
      throw new Error("No active peers");
    }
    const retrievalId = uuidV4();
    retrievalJobs[retrievalId] = {
      id: retrievalId,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      type: query.type,
      data: [],
    };
    // TODO: make the retieve mechanism more efficient
    // ... once we have a better distribution mechanism we can query only specific peers
    // ... for now we query all peers
    for (let peer of activeSockets) {
      send(peer.ws, {
        type: "retrieve",
        data: {
          ...query,
          retrievalId,
        },
      });
    }
  },
};
