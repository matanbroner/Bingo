const { WebSocket } = require("ws");
const uuidV4 = require("uuid").v4;

const generateMessageId = () => uuidV4();

const SERVER = "ws://localhost:5000";
const USER_ID = generateMessageId();
const DEVICE_ID = generateMessageId();

const ws = new WebSocket(SERVER);

ws.on("open", function open() {
  console.log("connected");
  ws.send(
    JSON.stringify({
      messageId: generateMessageId(),
      type: "identify",
      data: {
        id: USER_ID,
        payload: {
          deviceId: DEVICE_ID,
        },
      },
    })
  );
});

ws.on("message", function message(data) {
  console.log("received: %s", data);
});
