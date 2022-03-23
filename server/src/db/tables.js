const userTable = {
  name: "users",
  columns: {
    id: "TEXT NOT NULL UNIQUE",
    email: "TEXT NOT NULL UNIQUE",
    publicKey: "TEXT NOT NULL",
  },
  constraints: [],
};

module.exports = [userTable];
