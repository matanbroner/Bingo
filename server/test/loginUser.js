const superagent = require("superagent");
const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");

// read public key from assets/id_rsa.pub
const publicKey = fs.readFileSync(
  path.join(__dirname, "./assets/public.pem"),
  "utf8"
);
const email = "4d0649b2-a83c-4ac4-805c-96235c9aa649@bingo.com";
const password = "Bingo123!";

const loginUser = async (email, password, publicKey) => {
  return superagent
    .post(`http://localhost:5000/api/user/login`)
    .set("Content-Type", "application/json")
    .send({ email, password });
};

(async () => {
  try {
    const response = await loginUser(email, password, publicKey);
    console.log(response.body);
  } catch (error) {
    console.error(error.message);
  }
})();
