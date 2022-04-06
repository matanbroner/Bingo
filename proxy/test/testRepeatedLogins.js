const logger = require("logger");

const loginUser = require("./loginUser");
const EMAILS = process.argv[2].split(",");
const LOGIN_TIMES = process.argv[3] || 100;
const LOGIN_WAIT_INTERVAL_SECONDS = process.argv[4] || 30;

if (!EMAILS) {
  log.error("Please provide an email address as the first argument");
  process.exit(1);
}

const log = new logger.Logger({
  level: "debug",
});

const results = {
  success: 0,
  failure: 0,
};

for (let i = 0; i < LOGIN_TIMES; i++) {
  setTimeout(async () => {
    try {
      // choose random email from list
      const email = EMAILS[Math.floor(Math.random() * EMAILS.length)];
      await loginUser(email);
      results.success++;
      log.debug(`Successful login attempt ${i + 1}`);
    } catch (e) {
      results.failure++;
      log.debug(`Failed login attempt ${i + 1}`);
    }
  }, LOGIN_WAIT_INTERVAL_SECONDS * 1000 * i); // prevent all timeouts from happening at the same time
}
