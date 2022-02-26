const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const logger = require("logger");

const db = require("./src/db");
const app = express();
app.use(bodyParser.json());

dotenv.config();
const log = new logger.Logger({
  level: process.env.LOG_LEVEL,
});

global.logger = log;

// global async main function
(async () => {
  try {
    await db.dbInit();
    global.logger.info("Database connection successful");
    app.listen(process.env.PORT, () => {
      global.logger.info(`Server listening on port ${process.env.PORT}`);
    });
  } catch (err) {
    global.logger.error(`Server startup failed: ${err}`);
  }
})();
