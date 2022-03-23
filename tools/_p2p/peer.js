const EventEmitter = require("events");
const ndjson = require("ndjson");
const events = require("./events");

class Peer extends EventEmitter {
  constructor(socket, info, logger) {
    super();
    // hyperswarm peer object
    this._socket = socket;
    this._info = info;
    this._logger = logger;
    this.key = info.publicKey.toString("hex");

    this._setPipes();
    this._setSocketEventHandlers();
    this._handshake();
  }

  _setPipes() {
    this._readStream = ndjson.parse();
    this._writeStream = ndjson.stringify();

    this._socket.pipe(this._readStream);
    this._writeStream.pipe(this._socket);

    this._readStream.on(events.DATA, (data) => {
      this._logger.info(`[Peer ${this._info.id}] Received data: ${JSON.stringify(data)}`);
      if(data.event){
        this.emit(data.event, data);
      } else {
        this.emit(events.MESSAGE, data);
      }
    });
  }

  _setSocketEventHandlers() {
    this._socket.once(events.SOCKET.CLOSE, () => {
      this.emit(events.PEER_LEAVE);
    });
    this._socket.on(events.SOCKET.ERROR, (err) => {
      this.emit(events.ERROR, err);
    });
  }

  _handshake() {
    if (this._info.topics && this._info.topics.length > 0) {
      const [channel] = this._info.topics.slice(-1);
      this.send({
        event: events.HANDSHAKE,
        channel,
      });
      this.emit(events.PEER_CHANNEL_READY, channel);
    } else {
      this.once(events.HANDSHAKE, ({ channel }) => {
        this.send({
          event: events.HANDSHAKE,
          channel,
        });
        this.emit(events.PEER_CHANNEL_READY, channel);
      });
    }
  }

  // Exposed API

  send(data) {
    if (typeof data === "string") {
      data = { message: data };
    }
    this._writeStream.write(data);
  }

  disconnect() {
    this._socket.end();
  }
}

module.exports = Peer;
