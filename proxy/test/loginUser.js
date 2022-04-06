const uuidV4 = require("uuid").v4;
const launchClients = require("./launchClients");

const password = "Bingo123!";

const loginUser = async (email, password) => {
  return new Promise(async (resolve, reject) => {
    let ws = await launchClients(1);
    ws = ws[0];
    let ready = false;
    while (!ready) {
      if (ws.readyState === 1) {
        ready = true;
      }
    }
    const actionId = ws.addAction("login", (data, err) => {
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
            action: "login",
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
    const email = "097bb2c4-ee6c-4ac5-9973-4e6a9c3749bc@bingo.com"
    const [ws, response] = await loginUser(email, password);
    console.log(response);
    ws.close();
  } catch ([ws, error]) {
    console.error(`Login error: ${JSON.stringify(error)}`);
    ws.close();
  }
})();
