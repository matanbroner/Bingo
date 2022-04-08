const ACTIVE_SQUARE = "🟩";
const INACTIVE_SQUARE = "🟥";
const NULL_SQUARE = "⬜";
/**
 * Schedule creator for peers
 * Simulates a daily schedule where a user is randomly online or offline
 * ... for streteches of time.
 * @param {*} options
 *  - isNightOwl: boolean, whether the peer is night owl
 *  - clock: Clock, global clock
 *  - hoursOnline: number, hours of online time
 *  - secondToMinute: number, seconds in real life to minutes ratio in simulation
 *  - start: function, callback to start the peer
 *  - stop: function, callback to stop the peer
 */
const getSchedule = (options) => {
  let startAsActive = Math.random() < 0.5;
  let timeInPhase = 0;
  let activeAlarmId = null;
  let activeTimeouts = [];
  let inactiveTimeouts = [];
  let lineChart = null;

  const { hoursOnline, isNightOwl, secondToMinute, clock, start, stop } =
    options;
  // set aside major portion of time for online
  // ... take random fraction between 0.85 and 0.95
  const majorOnlinePortion = Math.floor(
    hoursOnline * (Math.random() * (0.95 - 0.75) + 0.75)
  );
  // set aside minor portion of time for online
  // ... taking remaining time
  const minorOnlinePortion = hoursOnline - majorOnlinePortion;

  // how many actual seconds the user is online
  const majorOnlinePortionSeconds = (majorOnlinePortion * 60) / secondToMinute;
  const minorOnlinePortionSeconds = (minorOnlinePortion * 60) / secondToMinute;

  const _generateSchedule = async () => {
    let phaseSeconds; // seconds in the phase (ie. day or night)
    let secondsUntilPhaseChange; // seconds until phase change (day to night or night to day)
    let phaseRatio; // ratio of the time left in the phase to the total phase's time
    let remainingSeconds; // real-world seconds left in the phase
    if (clock.isNight()) {
      // Night is 21 to 6 = 9 hours
      phaseSeconds = (9 * 60) / secondToMinute;
      secondsUntilPhaseChange = minutesUntil(clock, 6) / secondToMinute;
      phaseRatio = secondsUntilPhaseChange / phaseSeconds;
      if (isNightOwl) {
        remainingSeconds = majorOnlinePortionSeconds * phaseRatio;
      } else {
        remainingSeconds = minorOnlinePortionSeconds * phaseRatio;
      }
    } else {
      // Day is 6 to 21 = 15 hours
      phaseSeconds = (15 * 60) / secondToMinute;
      secondsUntilPhaseChange = minutesUntil(clock, 21) / secondToMinute;
      phaseRatio = secondsUntilPhaseChange / phaseSeconds;
      if (isNightOwl) {
        remainingSeconds = minorOnlinePortionSeconds * phaseRatio;
      } else {
        remainingSeconds = majorOnlinePortionSeconds * phaseRatio;
      }
    }
    remainingSeconds = Math.floor(remainingSeconds);
    // divide remaining seconds into random timeouts of 5 to 30 real-world seconds
    let activeSeconds = remainingSeconds;
    while (activeSeconds > 0) {
      // TODO: make the probability (ie. longer spans) for activity during the minor online portion
      // ... higher during the beginning of the portion, to behave more of a "spillover".
      // ... ex. A day owl should have their activity at night be closer to the beginning of the night, not at 3AM
      let timeout = Math.floor(Math.random() * ((activeSeconds / 2) - 10) + 10);
      activeSeconds -= timeout;
      if (activeSeconds < 0) {
        // if we overshot the transition to day, just use the remaining seconds
        timeout -= Math.abs(activeSeconds);
      }
      activeTimeouts.push(timeout);
    }
    let inactiveSeconds = secondsUntilPhaseChange - remainingSeconds;
    // generate as many inactive timeouts as we have active timeouts to be able to flip between them
    for (let i = 0; i < activeTimeouts.length; i++) {
      if (i === activeTimeouts.length - 1) {
        // push remaining inactive time
        inactiveTimeouts.push(Math.floor(inactiveSeconds));
        continue;
      }
      let timeout = Math.floor(Math.random() * ((inactiveSeconds / 2) - 10) + 10); // use longer spans of inactive time
      if (timeout > inactiveSeconds) {
        inactiveTimeouts.push(inactiveSeconds);
        inactiveSeconds = 0;
      } else {
        inactiveSeconds -= timeout;
        inactiveTimeouts.push(timeout);
      }
    }

    // allows timeouts to be handled in sync
    // ... also force function to wait for all timeouts to finish
    // ... use global clock alarms to prevent coexisting timeouts out of sync
    const handleAllTimeouts = () => {
      let activeTimeoutsCopy = [...activeTimeouts];
      let inactiveTimeoutsCopy = [...inactiveTimeouts];
      const updateTimeInPhase = (timeout) => {
        if (timeout > 0) {
          timeInPhase -= secondToMinute;
          clock.setAlarm(1, () => updateTimeInPhase(timeout - 1));
        }
      };

      return new Promise((resolve, reject) => {
        let wsActive = startAsActive;
        if (wsActive) {
          start();
        }
        // initialize phase timer
        try {
          const handleTimeout = async () => {
            if (!activeTimeoutsCopy.length && !inactiveTimeoutsCopy.length) {
              resolve();
            }
            if (wsActive) {
              // transition to next inactive timeout
              if (activeTimeoutsCopy.length > 0) {
                let timeout = activeTimeoutsCopy.shift();
                updateTimeInPhase(timeout);
                // BUG: +1 needed to line up with line chart
                activeAlarmId = clock.setAlarm(timeout, () => {
                  wsActive = false;
                  stop();
                  handleTimeout();
                });
              }
            } else {
              // transition to next active timeout
              if (inactiveTimeoutsCopy.length > 0) {
                const timeout = inactiveTimeoutsCopy.shift();
                activeAlarmId = clock.setAlarm(timeout, () => {
                  wsActive = true;
                  start();
                  handleTimeout();
                });
              }
            }
          };
          handleTimeout();
        } catch (e) {
          reject(e);
        }
      });
    };
    lineChart = scheduleLineChart(
      startAsActive,
      clock,
      secondToMinute,
      isNightOwl,
      activeTimeouts,
      inactiveTimeouts
    );
    await handleAllTimeouts();
    _generateSchedule();
  };

  return {
    start() {
      _generateSchedule();
    },
    stop() {
      if (activeAlarmId) {
        clock.clearAlarm(activeAlarmId);
      }
    },
    info() {
      return {
        hoursOnline: clock.isNight()
          ? isNightOwl
            ? majorOnlinePortion
            : minorOnlinePortion
          : isNightOwl
          ? minorOnlinePortion
          : majorOnlinePortion,
      };
    },
    getLineChart() {
      return lineChart;
    },
  };
};

const minutesUntil = (clock, hour) => {
  let timeUntil = 0;
  let [currentHour, currentMinute] = clock.getTime();
  while (currentHour !== hour) {
    if (currentMinute !== 0) {
      timeUntil += 60 - currentMinute;
      currentMinute = 0;
      currentHour++;
      continue;
    }
    timeUntil += 60;
    currentHour++;
    if (currentHour >= 24) {
      currentHour = currentHour % 24;
    }
  }
  return timeUntil;
};

const printSchedule = (
  clock,
  secondToMinute,
  isNightOwl,
  activeTimeouts,
  inactiveTimeouts
) => {
  let ACTIVE = "ACTIVE";
  let INACTIVE = "INACTIVE";
  let [currentHour, currentMinute] = clock.getTime();
  // assuming we start with inactive timeout for jitter between starts
  let active = false;
  let schedule = {};
  const updateSchedule = (mode) => {
    schedule[
      `${currentHour < 10 ? "0" : ""}${currentHour}:${
        currentMinute < 10 ? "0" : ""
      }${currentMinute}`
    ] = mode;
  };
  // initialize schedule
  updateSchedule(active ? ACTIVE : INACTIVE);
  // JS objects are passed by reference, so we need to copy the array
  let activeTimeoutsCopy = [...activeTimeouts];
  let inactiveTimeoutsCopy = [...inactiveTimeouts];
  while (activeTimeoutsCopy.length || inactiveTimeoutsCopy.length) {
    let timeout = null;
    if (active) {
      active = false;
      if (!inactiveTimeouts.length) {
        continue;
      }
      timeout = inactiveTimeoutsCopy.shift();
    } else {
      active = true;
      if (!activeTimeouts.length) {
        continue;
      }
      timeout = activeTimeoutsCopy.shift();
    }
    if (timeout) {
      const timeoutToSimulatedMinutes = timeout * secondToMinute;
      currentMinute += timeoutToSimulatedMinutes % 60;
      currentHour += Math.floor(timeoutToSimulatedMinutes / 60);
      while (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour++;
      }
      while (currentHour >= 24) {
        currentHour -= 24;
      }
      currentMinute; // rounding error
      updateSchedule(active ? ACTIVE : INACTIVE);
    }
  }
  console.log(
    `Schedule for ${isNightOwl ? "night owl" : "day owl"} during the ${
      clock.isNight() ? "night" : "day"
    } for a total of ${
      activeTimeouts.reduce((a, b) => a + b, 0) * secondToMinute
    } active minutes and ${
      inactiveTimeouts.reduce((a, b) => a + b, 0) * secondToMinute
    } inactive minutes`
  );
  console.log(schedule);
};

const scheduleLineChart = (
  active,
  clock,
  secondToMinute,
  isNightOwl,
  activeTimeouts,
  inactiveTimeouts
) => {
  let chart = [];
  const getChart = () => {
    let activeTimeoutsCopy = [...activeTimeouts];
    let inactiveTimeoutsCopy = [...inactiveTimeouts];
    while (activeTimeoutsCopy.length || inactiveTimeoutsCopy.length) {
      if (active) {
        if (!activeTimeoutsCopy.length) {
          timeout = null;
        }
        timeout = activeTimeoutsCopy.shift();
      } else {
        if (!inactiveTimeoutsCopy.length) {
          timeout = null;
        }
        timeout = inactiveTimeoutsCopy.shift();
      }
      if (timeout) {
        chart = chart.concat(
          Array(timeout).fill(active ? ACTIVE_SQUARE : INACTIVE_SQUARE)
        );
      }
      active = !active;
    }
  };
  const updateChart = () => {
    if (chart.length > 0) {
      chart = chart.slice(1);
    } else {
      getChart();
    }
    clock.setAlarm(1, updateChart);
  };

  // initialize chart
  clock.setAlarm(1, updateChart);

  return {
    print() {
      const DISPLAY_LEN = 10;
      if (chart.length > DISPLAY_LEN) {
        return chart.slice(0, DISPLAY_LEN).join("");
      } else {
        return chart
          .concat(Array(DISPLAY_LEN - chart.length).fill(NULL_SQUARE))
          .join("");
      }
    },
  };
};

module.exports = { getSchedule };
