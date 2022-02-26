const userTable = {
  name: "users",
  columns: {
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    email: "TEXT NOT NULL UNIQUE"
  },
  constraints: [],
};

module.exports = {
  users: userTable,
};
