const crypto = require("crypto");
const db = require("../db");

const sha256 = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

const decodePayloadById = async (id, payload) => {
  try {
    const user = await db.dbQueryOne("users", { id });
    if (!user) {
      throw new Error("User ID not found");
    }
    const { publicKey } = user;
    const buffer = Buffer.from(payload, "base64");
    const decoded = crypto.publicDecrypt(publicKey, buffer).toString("ascii");
    global.logger.debug(`Decoded payload: ${decoded}`); 
    return Promise.resolve(decoded);
  } catch (e) {
    return Promise.reject(e);
  }
};

module.exports = {
  sha256,
  decodePayloadById
};
