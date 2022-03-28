const superagent = require("superagent");
const fs = require("fs");
const uuidV4 = require("uuid").v4;
const path = require("path");
const launchClients = require("./launchClients");

const password = "Bingo123!";

const registerUser = async (email, password) => {
  return new Promise(async (resolve, reject) => {
    let ws = await launchClients(1);
    ws = ws[0];
    let ready = false;
    while (!ready) {
      if (ws.readyState === 1) {
        ready = true;
      }
    }
    const actionId = ws.addAction("register", (data, err) => {
      if (err) {
        reject([ws, err]);
      } else {
        resolve([ws, data]);
      }
    });
    ws.send(
      JSON.stringify({
        messageId: uuidV4(),
        type: "action",
        data: {
          actionId,
          payload: {
            action: "register",
            requestBody: {
              email,
              password,
            },
            domain: "localhost",
          },
        },
      })
    );
  });
};

(async () => {
  try {
    const email = `${uuidV4()}@bingo.com`;
    const [ws, response] = await registerUser(email, password);
    console.log(email);
    ws.close();
  } catch ([ws, error]) {
    console.error(`Register error: ${JSON.stringify(error)}`);
    ws.close();
  }
})();
