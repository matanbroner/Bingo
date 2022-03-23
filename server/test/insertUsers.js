const superagent = require("superagent");
const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");

// read public key from assets/id_rsa.pub
const publicKey = fs.readFileSync(
  path.join(__dirname, "./assets/public.pem"),
  "utf8"
);
const email = "test@bingo.com";
const password = "Bingo123!";

const registerUser = async (email, password, publicKey) => {
  const response = await superagent
    .post(`http://localhost:5000/api/user`)
    .set("Content-Type", "application/json")
    .send({ email, password, publicKey });
  return response;
};

const count = process.argv[2] || 1;

(async () => {
  let ids = [];
  for (let i = 0; i < count; i++) {
    // generate a random email
    const _email = `${uuidV4()}@bingo.com`;
    try {
      const response = await registerUser(_email, password, publicKey);
      ids.push(response.body.data.id);
      console.log(`Registered ${_email}`);
    } catch (err) {
      console.log(`Error for ${_email}: ${err.message}`);
    }
  }
  console.log(ids)
})();
