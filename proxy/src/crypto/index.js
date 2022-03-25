const crypto = require("crypto");
const murmurhash3 = require("murmurhash3");

const seed = parseInt(process.env.SEED);

const sha256 = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

const mmh3 = async (data) => {
  return new Promise((resolve, reject) => {
    murmurhash3.murmur128Hex(data, seed, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  })
}


module.exports = {
  sha256,
  mmh3,
};
