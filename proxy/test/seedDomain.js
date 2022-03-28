const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");
const db = require("db");

// manually set SEED for adding domain
// ... this is only to be done in development

process.env.SEED = "12345";

const { mmh3 } = require("../src/crypto");

const registerDomain = async (
  domain,
  baseApiUrl,
  loginRoute,
  registerRoute,
  idKey,
  secretKey,
  shares,
  threshold
) => {
  const id = await mmh3(domain);
  // Do not store password, pass it to relay server
  await db.dbInsert("domains", {
    id,
    baseApiUrl,
    loginRoute,
    registerRoute,
    idKey,
    secretKey,
    shares,
    threshold,
  });
  return id;
};

(async () => {
  await db.dbInit(path.join(__dirname, "../bingo_db"));
  const id = await registerDomain(
    "localhost",
    "http://localhost:8080/api",
    "/login",
    "/register",
    "email",
    "password",
    5,
    3
  );
  console.log(id);
})();
