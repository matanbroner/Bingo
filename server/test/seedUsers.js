const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");
const crypto = require("../src/crypto");
const db = require("../src/db");

// read public key from assets/id_rsa.pub
const publicKey = fs.readFileSync(
  path.join(__dirname, "./assets/public.pem"),
  "utf8"
);

const registerUser = async (email, publicKey) => {
  // SHA256 hash email for anonymity
  const hashEmail = crypto.sha256(email);
  // Bcrypt password
  // Create user
  const id = uuidV4();
  // Do not store password, pass it to relay server
  await db.dbInsert("users", {
    id,
    email: hashEmail,
    publicKey,
  });
  return id;
};

const count = process.argv[2] || 1;

(async () => {
  await db.dbInit(path.join(__dirname, "../bingo_db"));
  let ids = [];
  for (let i = 0; i < count; i++) {
    // generate a random email
    const _email = `${uuidV4()}@bingo.com`;
    try {
      const id = await registerUser(_email, publicKey);
      ids.push(id);
      console.log(`Registered ${_email}`);
    } catch (err) {
      console.log(`Error for ${_email}: ${err.message}`);
    }
  }
  console.log(ids);
})();
