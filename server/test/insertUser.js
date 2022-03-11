const superagent = require("superagent");
const fs = require("fs");
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

(async () => {
  try {
    await registerUser(email, password, publicKey);
  } catch (e) {
    console.error(
      `Status: ${e.status} - Error: ${JSON.stringify(e.response.body)}`
    );
  }
})();
