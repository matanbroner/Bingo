const express = require("express");
const userRouter = require("./user");

let router = express.Router();

router.use("/user", userRouter);

module.exports = router;
