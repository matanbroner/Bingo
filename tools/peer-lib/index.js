const dotenv = require("dotenv");
const logger = require("logger");
const db = require("db");

dotenv.config();
const log = new logger.Logger({
  level: process.env.LOG_LEVEL,
});

// Initialize global logger
global.logger = log;

// global async main function
(async () => {
  try {
    await db.dbInit();
    global.logger.info("Database connection successful");
    while(true){}
  } catch (err) {
    global.logger.error(`Server startup failed: ${err}`);
  }
})();
