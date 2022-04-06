const uuidV4 = require("uuid").v4;
const { launchClient } = require("./launchClients");

const password = "Bingo123!";

const loginUser = async (email, password) => {
  return new Promise(async (resolve, reject) => {
    let ws = await launchClient();
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
    const email = "f8e90af3-1962-4835-98ac-7f7bc3e1c05f@bingo.com";
    const [ws, response] = await loginUser(email, password);
    console.log(response);
    ws.close();
  } catch ([ws, error]) {
    console.error(`Login error: ${JSON.stringify(error)}`);
    ws.close();
  }
})();
