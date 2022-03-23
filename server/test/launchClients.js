const { WebSocket } = require("ws");
const uuidV4 = require("uuid").v4;
const fs = require("fs");
const _ = require("lodash");
const crypto = require("crypto");

const privateKey = fs.readFileSync("./assets/private.pem", "utf8");
const generateMessageId = () => uuidV4();

const SERVER = "ws://localhost:5000";
const DEVICE_ID = "a659fff6-d94f-4457-bdf9-5d602aa554ec";

const launchClient = (id) => {
  const ws = new WebSocket(SERVER);
  ws.on("open", function open() {
    ws.on("message", function message(data) {
      console.log(`ID ${id} received: ${data}`);
    });
    console.log(`Connected: ${id}`);
    ws.send(
      JSON.stringify({
        messageId: generateMessageId(),
        type: "identify",
        data: {
          id,
          payload: crypto.privateEncrypt(
            {
              key: privateKey,
              passphrase: "bingo",
            },
            Buffer.from(
              JSON.stringify({
                deviceId: DEVICE_ID,
              }).toString("base64")
            )
          ),
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
