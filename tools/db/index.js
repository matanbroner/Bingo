const sqlite3 = require("sqlite3");
const { dirname } = require("path");

let db = null;

const dbInit = async (dbPath) => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(
      dbPath || `${dirname(require.main.filename)}/${process.env.DB_NAME}`,
      async (err) => {
        if (err) {
          return reject(err);
        }
        // Create tables
        return resolve();
      }
    );
  });
};

const dbCreateTable = (table, columns, constraints) => {
  return new Promise((resolve, reject) => {
    let query = `CREATE TABLE IF NOT EXISTS ${table} (${Object.entries(columns)
      .map(([key, type]) => `${key} ${type}`)
      .join(", ")}${constraints.length ? ", " : ""}${constraints
      .map((c) => `${c}`)
      .join(", ")})`;
    if (global.logger) {
      global.logger.debug(query);
    }
    db.run(query, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const dbQueryOne = (table, params) => {
  const query = `SELECT * FROM ${table} WHERE ${Object.keys(params)
    .map((key) => `${key} = ?`)
    .join(" AND ")} LIMIT 1`;
  if (global.logger) {
    global.logger.debug(query);
  }
  return new Promise((resolve, reject) => {
    db.get(query, Object.values(params), (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });
};

const dbQuery = (table, params) => {
  const query = `SELECT * FROM ${table} WHERE ${Object.keys(params)
    .map((key) => `${key} = ?`)
    .join(" AND ")}`;
  if (global.logger) {
    global.logger.debug(query);
  }
  return new Promise((resolve, reject) => {
    db.all(query, Object.values(params), (err, rows) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
};

const dbInsert = (table, params) => {
  const query = `INSERT INTO ${table} (${Object.keys(params).join(
    ", "
  )}) VALUES (${Object.keys(params)
    .map((key) => `?`)
    .join(", ")})`;
  if (global.logger) {
    global.logger.debug(query);
  }
  return new Promise((resolve, reject) => {
    db.run(query, Object.values(params), (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};

const dbInstance = () => {
  return db;
};

module.exports = {
  dbInit,
  dbCreateTable,
  dbInsert,
  dbInstance,
  dbQuery,
  dbQueryOne,
};
