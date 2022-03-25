const express = require('express');
const bodyParser = require('body-parser');
const api = require("./api");

const app = express();
app.use(bodyParser.json());

app.use("/api", api);

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Bingo Server listening on port ${PORT}`);
})