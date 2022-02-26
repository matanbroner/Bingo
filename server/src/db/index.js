const sqlite3 = require("sqlite3");

let db = null;

const dbInit = async () => {
  db = new sqlite3.Database(process.env.DB_NAME, (err) => {
    if (err) {
      return Promise.reject(err);
    }
    return Promise.resolve();
  });
};

const dbInstance = () => {
    return db;
};

module.exports = {
    dbInit,
    dbInstance
};
