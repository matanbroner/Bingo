const { WebSocket } = require("ws");
const uuidV4 = require("uuid").v4;
const fs = require("fs");
const crypto = require("crypto");

const privateKey = fs.readFileSync("./assets/private.pem", "utf8");
const generateMessageId = () => uuidV4();

const SERVER = "ws://localhost:5000";
const USER_ID = "a659fff6-d94f-4457-bdf9-5d602aa554ec";
const DEVICE_ID = "a659fff6-d94f-4457-bdf9-5d602aa554ec";

const ws = new WebSocket(SERVER);

ws.on("open", function open() {
  console.log("connected");
  ws.send(
    JSON.stringify({
      messageId: generateMessageId(),
      type: "identify",
      data: {
        id: USER_ID,
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

ws.on("message", function message(data) {
  console.log("received: %s", data);
});
