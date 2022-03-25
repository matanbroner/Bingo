const { WebSocket } = require("ws");
const uuidV4 = require("uuid").v4;
const { argv } = require("process");

const generateMessageId = () => uuidV4();

const PROXY = "ws://localhost:5000";

const launchClient = () => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(PROXY);
    ws.storage = {};
    ws.actions = {};
    ws.addAction = (type, cb) => {
      const id = uuidV4();
      ws.actions[id] = {
        type,
        cb,
        completed: false,
      };
      return id;
    };
    ws.on("open", function open() {
      ws.on("message", function message(message) {
        message = JSON.parse(message);
        switch (message.type) {
          case "id": {
            ws._id = message._id;
            console.log(`Connected: ${ws._id}`);
            break;
          }
          case "distribute": {
            const { id, domain, data } = message.data;
            // rudimentary storage, in real version allow multiple
            // ... pieces of data to be stored per user
            ws.storage[domain] = ws.storage[domain] || {};
            ws.storage[domain][id] = data;
            console.log(`ID ${id} of domain ${domain} stored: ${data}`);
            break;
          }
          case "retrieve": {
            const { query, retrievalId } = message.data;
            const { id, domain } = query;
            // In real version we can utilize more complex queries
            // ... for this version just use basic pKey
            if (ws.storage[domain] && ws.storage[domain][id]) {
              const payload = ws.storage[domain][id];
              console.log(`ID ${id} for domain ${domain} retrieved: ${payload}`);
              ws.send(
                JSON.stringify({
                  messageId: generateMessageId(),
                  type: "retrieved",
                  data: {
                    payload,
                    retrievalId,
                  },
                })
              );
            }
            break;
          }
          case "action-success": {
            const { actionId } = message.data;
            const action = ws.actions[actionId];
            if (action) {
              action.completed = true;
              action.cb(message.data);
            }
            break;
          }
          case "action-error": {
            const { actionId } = message.error;
            const action = ws.actions[actionId];
            if (action) {
              action.completed = true;
              action.cb(null, message.error);
            }
            break;
          }
        }
      });
      resolve(ws);
    });
  });
};

module.exports = async (count = argv[2] || 1) => {
  let clients = [];
  for (let i = 0; i < count; i++) {
    clients.push(await launchClient());
  }
  return clients;
};
