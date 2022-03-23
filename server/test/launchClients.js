const { WebSocket } = require("ws");
const uuidV4 = require("uuid").v4;
const fs = require("fs");
const _ = require("lodash");
const crypto = require("crypto");

const privateKey = fs.readFileSync("./assets/private.pem", "utf8");
const generateMessageId = () => uuidV4();

const SERVER = "ws://localhost:5000";
const DEVICE_ID = "a659fff6-d94f-4457-bdf9-5d602aa554ec";

const encryptedPayload = (payload) =>
  {
    // if paylaod is an object, convert to string
    if (typeof payload === "object") {
      payload = JSON.stringify(payload);
    }
    return crypto.privateEncrypt(
      {
        key: privateKey,
        passphrase: "bingo",
      },
      Buffer.from(payload.toString("base64"))
    );
  }

const launchClient = (id) => {
  const ws = new WebSocket(SERVER);
  ws.storage = {};
  ws.on("open", function open() {
    ws.on("message", function message(message) {
      console.log(`ID ${id} received: ${message}`);
      message = JSON.parse(message);
      switch (message.type) {
        case "distribute": {
          const { id: userId, data } = message.data;
          // rudimentary storage, in real version allow multiple
          // ... pieces of data to be stored per user
          ws.storage[userId] = data;
          console.log(`ID ${userId} stored: ${data}`);
          break;
        }
        case "retrieve": {
          const { query, retrievalId } = message.data;
          // In real version we can utilize more complex queries
          // ... for this version just use basic pKey
          const payload = ws.storage[query.id];
          if (payload) {
            console.log(`ID ${id} retrieved: ${payload}`);
            ws.send(
              JSON.stringify({
                messageId: generateMessageId(),
                type: "retrieved",
                data: {
                  payload: encryptedPayload(payload),
                  retrievalId,
                  id,
                },
              })
            );
          }
        }
      }
    });
    console.log(`Connected: ${id}`);
    ws.send(
      JSON.stringify({
        messageId: generateMessageId(),
        type: "identify",
        data: {
          id,
          payload: encryptedPayload({
            deviceId: DEVICE_ID,
          }),
        },
      })
    );
  });
};

module.exports = (userIds) => {
  let clients = [];
  for (let i = 0; i < userIds.length; i++) {
    clients.push(launchClient(userIds[i]));
  }
  return clients;
};
