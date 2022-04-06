const express = require("express");
const bodyParser = require("body-parser");
const api = require("./api");

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
})
app.use("/api", api);
app.use(express.static(__dirname + "/public"));
app.get("/", (req, res) => {
  res.sendFile("/index.html");
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Bingo Server listening on port ${PORT}`);
});
