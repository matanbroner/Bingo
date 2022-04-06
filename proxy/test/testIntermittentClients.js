const logger = require("logger");
const uuidV4 = require("uuid").v4;
const { launchClient } = require("./launchClients");

const COUNT = process.argv[2] || 100;
const MIN_INTERVAL = process.argv[3] || 15;
const MAX_INTERVAL = process.argv[4] || 30;

let clients = [];

const log = new logger.Logger({
  level: "debug",
});

const shareStorage = () => {
  const storage = {};
  storage.store = (key, value) => {
    storage[key] = value;
  };
  storage.retrieve = (key) => {
    return storage[key];
  };
  return storage;
};

class PeerWrapper {
  constructor() {
    this.id = uuidV4();
    this.ws = null;
    this.shareStorage = shareStorage();
    this.cycle();
  }

  async cycle() {
    await this.start();
    if (!this.ws) {
      log.error(`Client failed to initialize cycle: ${this.id}`);
      return;
    }
    // choose random interval between MIN_INTERVAL and MAX_INTERVAL to stop
    const stopInterval = Math.floor(
      Math.random() * (MAX_INTERVAL - MIN_INTERVAL) + MIN_INTERVAL
    );
    setTimeout(() => {
      this.stop();
    }, stopInterval * 1000);
    // choose random interval between MIN_INTERVAL and MAX_INTERVAL to start
    const restartCycleInterval = Math.floor(
      Math.random() * (MAX_INTERVAL - MIN_INTERVAL) + MIN_INTERVAL
    );
    setTimeout(() => {
      this.cycle();
    }, restartCycleInterval * 1000);
  }

  async start() {
    try {
      this.ws = await launchClient(this.shareStorage);
      log.debug(`Client started: ${this.id}`);
    } catch (e) {
      log.error(`Client failed to start: ${this.id}`);
    }
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      log.debug(`Client stopped: ${this.id}`);
    }
  }
}

for (let i = 0; i < COUNT; i++) {
  const client = new PeerWrapper();
  clients.push(client);
}
