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
            domain: "bingo.com",
          },
        },
      })
    );
  });
};

(async () => {
  try {
    const email = "1cf1ca95-cf34-473a-a564-6f60add2de65@bingo.com"
    const [ws, response] = await loginUser(email, password);
    console.log(response);
    ws.close();
  } catch ([ws, error]) {
    console.error(`Login error: ${JSON.stringify(error)}`);
    ws.close();
  }
})();
