const uuidV4 = require("uuid").v4;
const crypto = require("crypto");
const db = require("../db");

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

  _connect() {
    let that = this;
    that._ws = new WebSocket(that._wssUri);
    that._ws.addEventListener("open", () => {
      console.log("Bingo connected on " + that._wssUri);
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
      case "id": {
        this._id = message.data.id;
        break;
      }
      case "distribute":
        break;
      case "retrieve":
        break;
      case "action-update":
        break;
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
          payload,
        },
      })
    );
  }

  _generateMessageId() {
    return uuidV4();
  }

  async _updateDomainData(domain, id, data) {
    return new Promise(async (resolve, reject) => {
      try {
        const domainData = await db.dbGet("shares", domain);
      } catch (err) {
        reject(err);
      }
    });
  }

  _handleDistribute(message) {
    const { id, domain, data } = message.data;
  }
}

export default Peer;
