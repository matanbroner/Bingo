const EventEmitter = require("events");
const ndjson = require("ndjson");
const events = require("./events");

class Peer extends EventEmitter {
  constructor(socket, info) {
    super();
    // hyperswarm peer object
    this._socket = socket;
    this._info = info;
    this.key = info.publicKey.toString("hex");

    this._setPipes();
  }

  _setPipes() {
    this._readStream = ndjson.parse();
    this._writeStream = ndjson.stringify();

    this._socket.pipe(this._readStream);
    this._writeStream.pipe(this._socket);

    this._readStream.on(events.DATA, (data) => {
        this.emit(events.DATA, data);
        this.emit(data.event, data.message);
    })
  }

  _handshake() {
    this._writeStream.write({
      event: "handshake",
      key: this.key,
    });
  }
}

module.exports = Peer;
