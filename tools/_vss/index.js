const { share } = require("./feldman");

(async () => {
  const { commitments, shares, verification } = await share(3, 2, 417);
  console.log(commitments);
  console.log(shares);
  console.log(verification);
})();
