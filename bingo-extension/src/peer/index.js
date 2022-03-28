const uuidV4 = require("uuid").v4;
const crypto = require("crypto");

const RECONNECT_TIMEOUT = 5000;

class Peer {
  constructor(_wssUri, errorCb) {
    this._wssUri = _wssUri;
    this._errorCb = errorCb;
    this._connect();
  }

  ready() {
    return this._initialized && this._ws && this._ws.readyState === 1;
  }

  disconnect() {
    if (this._ws && this._ws.readyState === 1) {
      this._ws.close();
    }
  }

  addAction(type, requestBody, domain, cb) {
    const actionId = this._ws.addAction(type, cb);
    console.log("Sending action: " + actionId);
    this._send("action", {
      actionId,
      payload: {
        action: type,
        requestBody,
        domain,
      },
    });
  }

  _connect() {
    let that = this;
    that._ws = new WebSocket(that._wssUri);
    that._ws.addEventListener("open", () => {
      console.log("Bingo connected on " + that._wssUri);
      that._ws.actions = {};
      that._ws.addAction = (type, cb) => {
        const id = uuidV4();
        that._ws.actions[id] = {
          type,
          cb,
          completed: false,
        };
        return id;
      };
    });
    that._ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      that._onMessage(message);
    });
    that._ws.addEventListener("error", (event) => {
      that._errorCb(JSON.stringify(event));
    });
    that._ws.addEventListener("close", (event) => {
      setTimeout(() => {
        that._connect();
      }, RECONNECT_TIMEOUT);
    });
  }

  _onMessage(message) {
    switch (message.type) {
      case "id": {
        this._id = message.data.id;
        break;
      }
      case "distribute":
        this._handleDistribute(message);
        break;
      case "retrieve":
        this._handleRetrieve(message);
        break;
      case "action-update": {
        const actionId = message.data
          ? message.data.actionId
          : message.error.actionId;
        const action = this._ws.actions[actionId];
        if (action) {
          console.log("Action update: " + actionId);
          action.completed = true;
          if (message.data) {
            action.cb(message.data);
          } else if (message.error) {
            action.cb(null, message.error);
          }
        }
        break;
      }
      default:
        console.log("Unhandled message type: " + message.type);
    }
  }

  _send(type, data, replyId = null) {
    this._ws.send(
      JSON.stringify({
        messageId: this._generateMessageId(),
        replyId,
        type,
        data,
      })
    );
  }

  _generateMessageId() {
    return uuidV4();
  }

  _handleRetrieve(message) {
    const { query, retrievalId } = message.data;
    chrome.runtime.sendMessage(
      {
        type: "DATA_RETRIEVE",
        table: "shares",
        payload: query,
      },
      function (response) {
        if (response.type === "SUCCESS") {
          const { data } = response;
          that._send("retrieved", { retrievalId, payload: data });
        } else {
          // TODO: send error to wss, for now log
          console.log("Failed to retrieve data: " + response.error.message);
        }
      }
    );
  }

  _handleDistribute(message) {
    const { id, domain, data } = message.data;
    chrome.runtime.sendMessage(
      {
        type: "DATA_STORE",
        table: "shares",
        data: {
          id,
          domain,
          data,
        },
      },
      (response) => {
        if (response.type !== "SUCCESS") {
          // TODO: send error to wss, for now log
          console.log("Failed to store share data: " + response.error.message);
        }
      }
    );
  }
}

export default Peer;
