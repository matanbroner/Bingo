const logger = require("logger");
const uuidV4 = require("uuid").v4;
const { launchClient } = require("./launchClients");
const { getSchedule } = require("./assets/schedule");

const COUNT = process.argv[2] || 100;
const CLOCK_INTERVAL_MINUTES = 1;
const NIGHT_OWL_SIGN = "🌙";
const NOT_NIGHT_OWL_SIGN = "🌞";
const GREEN_CHECKBOX_EMOJI = "✅";
const RED_X_EMOJI = "❌";

let peers = {};

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
  _clock.alarms = {};
  _clock.increment = increment;
  // clock starts at 6AM
  _clock.hour = 6;
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
      const alarms = _clock.alarms[_clock.stringTime()];
      if (alarms && alarms.length) {
        alarms.forEach((alarm) => {
          alarm.callback();
        });
      }
      _clock.alarms[_clock.stringTime()] = [];
      logPeerInfoTable();
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

  _clock.setAlarm = (seconds, callback) => {
    const [hour, minute] = _clock.simulatedTime(seconds);
    const key = _clock.stringTime(hour, minute);
    const id = `${key}-${uuidV4()}`;
    if (!_clock.alarms[key]) {
      _clock.alarms[key] = [{ id, callback }];
    } else {
      _clock.alarms[key].push({ id, callback });
    }
    return id;
  };

  _clock.clearAlarm = (id) => {
    const time = id.split("-")[0];
    if (time in _clock.alarms) {
      _clock.alarms[time] = _clock.alarms[time].filter(
        (alarm) => alarm.id !== id
      );
    }
  };

  _clock.simulatedTime = (seconds) => {
    let [currentHour, currentMinute] = _clock.getTime();
    let minutes = seconds * _clock.increment;
    let hour = Math.floor(minutes / 60);
    minutes = minutes % 60;
    currentHour += hour;
    currentMinute += minutes;
    while (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
    while (currentHour >= 24) {
      currentHour = currentHour % 24;
    }
    return [currentHour, currentMinute];
  };

  _clock.stringTime = (hour = null, minute = null) => {
    hour = typeof hour === "number" ? hour : _clock.hour;
    minute = typeof minute === "number" ? minute : _clock.minute;
    const pm = hour >= 12;
    hour = hour < 10 ? `0${hour}` : hour;
    minute = minute < 10 ? `0${minute}` : minute;
    return `${hour}:${minute} ${pm ? "PM" : "AM"}`;
  };

  _clock.isNight = () => {
    return _clock.hour < 6 || _clock.hour >= 21;
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
  // low chance of night owl
  return Math.random() < 0.3 ? true : false;
};

class PeerWrapper {
  constructor(clock) {
    this.id = uuidV4();
    this.ws = null;
    this.shareStorage = shareStorage();
    this.clock = clock;
    this.nightOwl = isNightOwl();
    this.schedule = getSchedule({
      isNightOwl: this.nightOwl,
      clock: this.clock,
      hoursOnline: Math.floor(Math.random() * (7 - 4 + 1)) + 4, // 4-7 hours online per day
      secondToMinute: this.clock.increment,
      start: this.start.bind(this),
      stop: this.stop.bind(this),
    });
    this.cycle();
  }

  async cycle() {
    this.schedule.start();
  }

  async start() {
    try {
      this.ws = await launchClient(this.shareStorage, (err) => {
        log.error(`WS ID ${this.id} error: ${err}`);
      });
    } catch (e) {
      log.error(`Client failed to start: ${this.id}`);
    }
  }

  stop() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const logPeerInfoTable = () => {
  process.stdout.write("\033c");
  let peerInstances = Object.values(peers);
  log.info(
    `Information for ${
      peerInstances.length
    } peers at time [${peerClock.stringTime()}]`
  );
  log.info(
    `Current phase: ${
      peerClock.isNight()
        ? `Night ${NIGHT_OWL_SIGN}`
        : `Day ${NOT_NIGHT_OWL_SIGN}`
    }`
  );
  const rows = peerInstances.map((peer) => {
    const { id, nightOwl, ws, schedule } = peer;
    const info = schedule.info();
    return {
      id,
      ["Owl?"]: nightOwl ? NIGHT_OWL_SIGN : NOT_NIGHT_OWL_SIGN,
      ["Active?"]: ws ? GREEN_CHECKBOX_EMOJI : RED_X_EMOJI,
      ["Online Hrs."]: info.hoursOnline,
      ["Chart"]: schedule.getLineChart().print(),
    };
  });
  console.table(rows);
};

// global synchronized clock for all peers
const peerClock = clock(CLOCK_INTERVAL_MINUTES);
peerClock.start();

for (let i = 0; i < COUNT; i++) {
  const peer = new PeerWrapper(peerClock);
  peers[peer.id] = peer;
}
