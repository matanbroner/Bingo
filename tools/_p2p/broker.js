const EventEmitter = require("events");
const Channel = require("./channel");
const Peer = require("./peer");
const Hyperswarm = require("hyperswarm");
const crypto = require("crypto");
const logger = require("logger");
const events = require("./events");

class Broker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.id = options.id || crypto.randomBytes(32).toString("hex");
    this.channels = new Map();
    this.logger = new logger.Logger({
      level: options.logLevel || "info",
    });

    this._swarm = options.swarm || new Hyperswarm(options);
    this._handleConnection = this._handleConnection.bind(this);
    this._swarm.on(events.SOCKET.CONNECTION, this._handleConnection);
  }

  _handleConnection(socket, info) {
    this.logger.info(`[Broker ${this.id}] New peer: ${this.id}`);
    const peer = new Peer(socket, { ...info, id: this.id }, this.logger);
    this.emit(events.PEER_JOIN, peer, info);
  }

  // Exposed API

  async channel(name) {
    const topic = Buffer.alloc(32).fill(name);
    if (!this.channels.has(name)) {
      const channel = new Channel(this, topic);
      const discovery = this._swarm.join(topic, { server: true, client: true });
      await discovery.flushed();
      this.channels.set(name, channel);
      this.emit(events.BROKER_CHANNEL, name);
      channel.once(events.CHANNEL_CLOSE, () => {
        this._swarm.leave(topic);
        this.channels.delete(name);
      });
    } else {
      this.logger.error(
        `[Broker ${this.id}] Channel ${name} (${name}) already exists`
      );
    }
    return this.channels.get(name);
  }

  disconnect(cb) {
    this._swarm.removeListener(
      events.SOCKET.CONNECTION,
      this._handleConnection
    );
    this._swarm.destroy(cb);
    this.emit(events.BROKER_CLOSED);
  }
}

module.exports = Broker;
