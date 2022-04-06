const logger = require("logger");
const uuidV4 = require("uuid").v4;
const { launchClient } = require("./launchClients");

const COUNT = process.argv[2] || 100;
const CLOCK_INTERVAL_MINUTES = 1;
const MIN_INTERVAL = process.argv[3] || 10; // 10 minutes
const MAX_INTERVAL = process.argv[4] || 180; // 3 hours
const NIGHT_OWL_SIGN = "🌙";
const NOT_NIGHT_OWL_SIGN = "🌞";

let clients = [];

const log = new logger.Logger({
  level: "debug",
});

/**
 * Simulate a sped up 24 hour clock
 * Provided an increment in minutes (ex. 15) to correspond to every real 1 second
 * @param {int} increment - minutes to increment (should be 1-60)
 * @returns clock inteface with start(), stop(), reset(), getTime(), and isNight()
 */
const clock = (increment) => {
  let _clock = {};
  _clock.hour = 0;
  _clock.minute = 0;

  _clock.start = () => {
    _clock.interval = setInterval(() => {
      _clock.minute += increment;
      if (_clock.minute >= 60) {
        _clock.hour += Math.floor(_clock.minute / 60);
        _clock.minute = _clock.minute % 60;
      }
      if (_clock.hour >= 24) {
        _clock.hour = _clock.hour % 24;
      }
    }, 1000);
  };
  _clock.stop = () => {
    if (_clock.interval) {
      clearInterval(_clock.interval);
    }
  };
  _clock.reset = () => {
    _clock.stop();
    _clock.hour = 0;
    _clock.minute = 0;
  };

  _clock.getTime = () => {
    return [_clock.hour, _clock.minute];
  };

  _clock.stringTime = () => {
    const pm = _clock.hour >= 12;
    const hour = _clock.hour < 10 ? `0${_clock.hour}` : _clock.hour;
    const minute = _clock.minute < 10 ? `0${_clock.minute}` : _clock.minute;
    return `${hour}:${minute} ${pm ? "PM" : "AM"}`;
  };

  _clock.isNight = () => {
    return _clock.hour < 6 || _clock.hour > 18;
  };

  return _clock;
};

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

const isNightOwl = () => {
  return Math.floor(Math.random() * 2) == 0;
};

class PeerWrapper {
  constructor(clock) {
    this.id = uuidV4();
    this.ws = null;
    this.shareStorage = shareStorage();
    this.clock = clock;
    this.nightOwl = isNightOwl();
    // prevent everyone from starting at the same time
    setTimeout(() => {
      this.cycle();
    }, this.chooseInterval(true) * 1000);
  }

  async cycle() {
    await this.start();
    if (!this.ws) {
      log.error(`Client failed to initialize cycle: ${this.id}`);
      return;
    }
    // choose random interval between MIN_INTERVAL and MAX_INTERVAL to stop
    setTimeout(() => {
      this.stop();
    }, this.chooseInterval(false) * 1000);
    // choose random interval between MIN_INTERVAL and MAX_INTERVAL to start
    setTimeout(() => {
      this.cycle();
    }, this.chooseInterval(true) * 1000);
  }

  async start() {
    try {
      this.ws = await launchClient(this.shareStorage, (err) => {
        log.error(`WS ID ${this.id} error: ${err}`);
      });
      log.debug(
        `[${
          this.nightOwl ? NIGHT_OWL_SIGN : NOT_NIGHT_OWL_SIGN
        }] Client started at time ${this.clock.stringTime()}: ${this.id}`
      );
    } catch (e) {
      log.error(`Client failed to start: ${this.id}`);
    }
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      log.debug(
        `[${
          this.nightOwl ? NIGHT_OWL_SIGN : NOT_NIGHT_OWL_SIGN
        }] Client stopped at time ${this.clock.stringTime()}: ${this.id}`
      );
    }
  }

  chooseInterval(isStartInterval) {
    if (
      (this.nightOwl && this.clock.isNight()) ||
      (!this.nightOwl && !this.clock.isNight())
    ) {
      // peer is more likely to be up, shorter interval to start
      // ... and longer interval to stop
      if (isStartInterval) {
        // scale back max interval by 1.5
        return (
          Math.floor(Math.random() * (MAX_INTERVAL / 1.5 - MIN_INTERVAL)) +
          MIN_INTERVAL
        );
      } else {
        // scale up min interval by 1.5
        return (
          Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL * 1.5)) +
          MIN_INTERVAL * 1.5
        );
      }
    } else {
      // peer is less likely to be up, longer interval to start
      // ... and shorter interval to stop
      if (isStartInterval) {
        // scale up min interval by 1.5
        return (
          Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL * 1.5)) +
          MIN_INTERVAL * 1.5
        );
      } else {
        // scale back max interval by 1.5
        return (
          Math.floor(Math.random() * (MAX_INTERVAL / 1.5 - MIN_INTERVAL)) +
          MIN_INTERVAL
        );
      }
    }
  }
}


// global synchronized clock for all peers
const peerClock = clock(CLOCK_INTERVAL_MINUTES);
peerClock.start();

for (let i = 0; i < COUNT; i++) {
  const client = new PeerWrapper(peerClock);
  clients.push(client);
}
