const config = require("../assets/config");
import Dexie from "dexie";
import logger from "../logger";

let db = null;

function dbInit() {
  if (!db) {
    db = new Dexie(config.DB_NAME);
    db.version(1).stores({
      shares: "id, domain, data",
    });
  }
  logger.info("DB initialized");
  return db;
}

export { dbInit };
