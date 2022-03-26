const config = require("../assets/config");
import Dexie from "dexie"
import logger from "../logger";

let db = null;

async function dbInit(table, keyPath) {
  try {
    await openDB(config.DB_NAME, undefined, )
  } catch (e) {
    logger.error(e);
  }
  return new Promise((resolve, reject) => {
    if (db) {
      return;
    }
    const request = window.indexedDB.open(config.DB_NAME);

    request.onerror = function (event) {
      logger.error(`Error opening DB: ${event.message}`);
      reject(`Error opening DB: ${event.message}`);
    };

    request.onupgradeneeded = function (event) {
      db = event.target.result;

      let objectStore = db.createObjectStore(table, {
        keyPath,
      });

      objectStore.transaction.oncomplete = function (event) {
        logger.info(`Created object store ${table}`);
      };
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      logger.info(`Successfully opened DB ${config.DB_NAME}`);

      db.onerror = function (event) {
        logger.error(`Error opening DB: ${event.message}`);
      };
    };
  });
}

async function dbInsert(table, key, data) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB not initialized");
      return;
    }
    const transaction = db.transaction(table, "readwrite");
    const objectStore = transaction.objectStore(table);
    const request = objectStore.add(data, key);

    request.onerror = function (event) {
      reject(`Error inserting data: ${event.message}`);
    };

    request.onsuccess = function (event) {
      resolve(`Successfully inserted data into ${table}`);
    };
  });
}

function dbGet(table, key) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB not initialized");
      return;
    }
    const transaction = db.transaction(table, "readonly");
    const objectStore = transaction.objectStore(table);
    const request = objectStore.get(key);

    request.onerror = function (event) {
      reject(`Error getting data: ${event.message}`);
    };

    request.onsuccess = function (event) {
      resolve(`Successfully got data from ${table}`);
    };
  });
}

async function dbUpdate(table, key, data) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB not initialized");
      return;
    }
    const transaction = db.transaction(table, "readwrite");
    const objectStore = transaction.objectStore(table);
    const request = objectStore.put(data, key);

    request.onerror = function (event) {
      reject(`Error updating data: ${event.message}`);
    };

    request.onsuccess = function (event) {
      resolve(`Successfully updated data in ${table}`);
    };
  });
}

async function dbDelete(table, key) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB not initialized");
      return;
    }
    const transaction = db.transaction(table, "readwrite");
    const objectStore = transaction.objectStore(table);
    const request = objectStore.delete(key);

    request.onerror = function (event) {
      reject(`Error deleting data: ${event.message}`);
    };

    request.onsuccess = function (event) {
      resolve(`Successfully deleted data from ${table}`);
    };
  });
}

export { dbInit, dbInsert, dbGet, dbUpdate, dbDelete };
