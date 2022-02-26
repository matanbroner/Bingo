const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const logger = require("logger");

const db = require("./src/db");
const api = require("./src/api");

// Load .env file
dotenv.config();
const log = new logger.Logger({
  level: process.env.LOG_LEVEL,
});

// Initialize global logger
global.logger = log;

// Initialize express app and API
const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Log incoming requests - Middleware
app.use((req, res, next) => {
  let httpVersion = req.httpVersionMajor + "." + req.httpVersionMinor;
  let method = req.method;
  let url = req.originalUrl;

  global.logger.debug(`${method} ${url} HTTP/${httpVersion}`);
  next();
});
// Health check
app.get("/", (req, res) => {
  res.send("OK");
});
app.use("/api", api);
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
