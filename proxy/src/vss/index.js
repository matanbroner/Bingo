// Secret sharing handler
// Currently using non-verifiable (ie. standard Shamir) secret sharing
// TODO: implement verifiable secret sharing

const secrets = require("secrets.js-grempe");

module.exports = {
  getShares(s, n, t) {
    global.logger.debug(`Splitting secret: ${s} into ${n} shares with threshold ${t}`);
    if (typeof s !== "string") {
      throw new Error("Secret must be a string");
    }
    const sHex = secrets.str2hex(s);
    return secrets.share(sHex, n, t);
  },
  reconstructSecret(shares, t) {
    if (shares.length < t) {
      throw new Error("Incufficient shares based on given threshold");
    }
    let combined = secrets.combine(shares);
    return secrets.hex2str(combined);
  },
};
