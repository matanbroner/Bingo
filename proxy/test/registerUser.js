const superagent = require("superagent");
const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");

// read public key from assets/id_rsa.pub
const publicKey = fs.readFileSync(
  path.join(__dirname, "./assets/public.pem"),
  "utf8"
);
const password = "Bingo123!";

const registerUser = async (email, password, publicKey) => {
  return superagent
    .post(`http://localhost:5000/api/user`)
    .set("Content-Type", "application/json")
    .send({ email, password, publicKey });
};

(async () => {
  try {
    const email = `${uuidV4()}@bingo.com`;
    const response = await registerUser(email, password, publicKey);
    const { id } = response.body.data;
    console.log({
        id,
        email,
    })
  } catch (error) {
    console.error(error.message);
  }
})();
