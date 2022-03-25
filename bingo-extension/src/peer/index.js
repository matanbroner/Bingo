const uuidV4 = require("uuid").v4;
const logger = require("../logger");
const db = require("../db");

class Peer {
  constructor(id, wsServerUri, errorCb) {
    this._id = id;
    this._wsServerUri = wsServerUri;
    this._errorCb = errorCb;
    this._initialized = false;
  }

  async init() {
    let that = this;
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(["keys", "deviceId"], function (result) {
          if (
            typeof result.keys === "undefined" ||
            typeof result.deviceId === "undefined"
          ) {
            reject("Missing peer configuration");
          }
          let { keys, deviceId } = result;
          that._deviceId = deviceId;
          that._keyPair = keys;
          that._initialized = true;
          that._connect();
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  ready() {
    return this._initialized && this._ws && this._ws.readyState === 1;
  }

  disconnect() {
    if (this._ws && this._ws.readyState === 1) {
      this._ws.close();
    }
  }

  _connect() {
    let that = this;
    if (!that._initialized) {
      throw new Error("Peer not initialized");
    }
    that._ws = new WebSocket(that._wsServerUri);
    that._ws.addEventListener("open", () => {
      logger.debug("WS " + that._id + " connected to " + that._wsServerUri);
      that._send("identify", {
        deviceId: that._deviceId,
      });
    });
    that._ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      that._onMessage(message);
    });
    that._ws.addEventListener("error", (event) => {
      that._errorCb(JSON.stringify(event));
    });
  }

  _onMessage(message) {
    switch (message.type) {
      default:
        console.log("Unhandled message type: " + message.type);
    }
  }

  _send(type, payload, replyId = null) {
    this._ws.send(
      JSON.stringify({
        messageId: this._generateMessageId(),
        replyId,
        type,
        data: {
          id: this._id,
          payload: this._encryptedPayload(payload),
        },
      })
    );
  }

  _encryptPayload(payload) {
    return crypto.privateEncrypt(
      {
        key: this._keyPair.private,
      },
      Buffer.from(payload.toString("base64"))
    );
  }

  _decryptPayload(payload) {
    return crypto.publicDecrypt(
      {
        key: this._keyPair.public,
      },
      Buffer.from(payload.toString("base64"))
    );
  }

  _generateMessageId() {
    return uuidV4();
  }
}

export default Peer;
