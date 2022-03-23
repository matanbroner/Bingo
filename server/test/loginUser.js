const superagent = require("superagent");
const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");

// read public key from assets/id_rsa.pub
const publicKey = fs.readFileSync(
  path.join(__dirname, "./assets/public.pem"),
  "utf8"
);
const email = "d369bd31-976b-4271-a97b-5db201f458e5@bingo.com";
const password = "Bingo123!";

const loginUser = async (email, password, publicKey) => {
  const response = await superagent
    .post(`http://localhost:5000/api/user/login`)
    .set("Content-Type", "application/json")
    .send({ email, password });
  return response;
};

(async () => {
  const response = await loginUser(email, password, publicKey);
  console.log(response.body);
})();
