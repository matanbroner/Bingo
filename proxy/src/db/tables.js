const domainTable = {
  name: "domains",
  columns: {
    id: "TEXT NOT NULL UNIQUE",
    baseApiUrl: "TEXT NOT NULL UNIQUE",
    loginRoute: "TEXT NOT NULL",
    registerRoute: "TEXT NOT NULL",
    idKey: "TEXT NOT NULL",
    secretKey: "TEXT NOT NULL",
    shares: "NUMBER NOT NULL DEFAULT " + parseInt(process.env.SHARES) || 10,
    threshold: "NUMBER NOT NULL DEFAULT " + parseInt(process.env.THRESHOLD) || 4,
    replicationFactor: "NUMBER NOT NULL DEFAULT " + parseInt(process.env.REPLICATION_FACTOR) || 1,
  },
  constraints: [],
};

const userTable = {
  name: "users",
  columns: {
    id: "TEXT NOT NULL UNIQUE",
    domainId: "TEXT NOT NULL",
  },
  constraints: [
    "FOREIGN KEY (domainId) REFERENCES domains(id) ON DELETE CASCADE",
  ],
};

module.exports = [domainTable, userTable];
