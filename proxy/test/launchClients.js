const { WebSocket } = require("ws");
const uuidV4 = require("uuid").v4;
const { argv } = require("process");

const generateMessageId = () => uuidV4();

const PROXY = "ws://localhost:5000";

const launchClient = (storage, errCb = null) => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(PROXY);
    ws.actions = {};
    ws.storage = storage || {};
    ws.addAction = (type, cb) => {
      const id = uuidV4();
      ws.actions[id] = {
        type,
        cb,
        completed: false,
      };
      return id;
    };
    ws.on("error", (err) => {
      if (errCb) {
        errCb(err);
      }
    });
    ws.on("open", function open() {
      ws.on("message", function message(message) {
        message = JSON.parse(message);
        switch (message.type) {
          case "id": {
            ws._id = message.data.id;
            break;
          }
          case "distribute": {
            const { payload, distributionId } = message.data;
            const { domain, id, share } = payload;
            if (typeof ws.storage.store === "function") {
              ws.storage.store(`${domain}.${id}`, share);
            } else {
              ws.storage[`${domain}.${id}`] = share;
            }
            ws.send(
              JSON.stringify({
                messageId: generateMessageId(),
                type: "distributed",
                data: {
                  distributionId,
                },
              })
            );
            break;
          }
          case "retrieve": {
            const { query, retrievalId } = message.data;
            const { id, domain } = query;
            // In real version we can utilize more complex queries
            // ... for this version just use basic pKey
            let payload;
            if (typeof ws.storage.retrieve === "function") {
              payload = ws.storage.retrieve(`${domain}.${id}`);
            } else {
              payload = ws.storage[`${domain}.${id}`];
            }
            if (payload) {
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
          case "action-update": {
            const actionId = message.data
              ? message.data.actionId
              : message.error.actionId;
            const action = ws.actions[actionId];
            if (action) {
              action.completed = true;
              if (message.data) {
                action.cb(message.data);
              } else if (message.error) {
                action.cb(null, message.error);
              }
            }
            break;
          }
        }
      });
      resolve(ws);
    });
  });
};

module.exports = {
  launchClient,
  launchClients: async (count = argv[2] || 1) => {
    let clients = [];
    for (let i = 0; i < count; i++) {
      clients.push(await launchClient());
    }
    return clients;
  },
};
