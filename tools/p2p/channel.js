const EventEmitter = require("events");
const events = require("./events");

class Channel extends EventEmitter {
  constructor(global, key) {
    super();
    this.key = key;
    this._global = global;
    this.peers = new Set();
    this._setGlobalEventHandlers();
  }

  _setHandlerEventHandlers() {
    this._global.on(events.PEER_JOIN, (peer) => {
      peer.once(events.PEER_CHANNEL_READY, this._addPeer.bind(this, peer));
    });
    this._global.on(events.PEER_LEAVE, (peer) => {
      this.peers.delete(peer);
      this.emit(events.PEER_LEAVE, peer);
    });
  }

  _addPeer(peer, key) {
    if (key === this.key) {
      this.peers.add(peer);
      this.emit(events.PEER_JOIN, peer);
      peer.once(PEER_LEAVE, () => {
        this.peers.delete(peer);
        this.emit(events.PEER_LEAVE, peer);
      });
      peer.on(events.MESSAGE, (data) => {
        this.emit(events.MESSAGE, data);
      });
    }
  }

  _broadcast(data) {
    this.peers.forEach((peer) => peer.send(data));
  }

  // Exposed API

  broadcast(message) {
    const data = {
      message,
      event: events.MESSAGE,
    };
    this._broadcast(data);
  }

  send(publicKey, message) {
    // make sure key is string
    if (Buffer.isBuffer(publicKey)) {
      publicKey = publicKey.toString("hex");
    }
    // find peer in set
    const peer = this.peers.find((peer) => peer.key === publicKey);
    if (!peer) {
      this._global.logger.info(`No peer found for key ${publicKey}`);
    }
    const data = {
      message,
      event: events.MESSAGE,
    };
    peer.send(data);
  }

  close() {
    this.global.removeListener(events.PEER_JOIN, this._addPeer);
    for (const peer of this.peers) {
      peer.disconnect();
    }
    this.emit(events.CHANNEL_CLOSE)
    this._global = null
  }
}

module.exports = Channel;
