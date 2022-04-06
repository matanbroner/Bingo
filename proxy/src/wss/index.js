const WSS = require("ws").Server;
const uuidV4 = require("uuid").v4;
const superagent = require("superagent");
const _ = require("lodash");
const db = require("db");
const { RetrievalJob, DistributeJob } = require("./jobs");
const mmh3 = require("../crypto").mmh3;
const vss = require("../vss");

const generateMessageId = () => uuidV4();

let wss = null;
let retrievalJobs = {};
let distributeJobs = {};

const send = (ws, message) => {
  ws.send(
    JSON.stringify({
      ...message,
      messageId: generateMessageId(),
    })
  );
};

const promiseRetrievalJob = (retrievalId, query, threshold) => {
  return new Promise((resolve, reject) => {
    retrievalJobs[retrievalId] = new RetrievalJob(
      retrievalId,
      {
        type: "retrieve",
        data: {
          query,
          retrievalId,
        },
      },
      threshold,
      wss.activeSockets,
      send,
      (data, err) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
};

const promiseDistributeJob = (distributionId, items) => {
  items = items.map((item) => {
    return {
      type: "distribute",
      data: {
        distributionId,
        payload: item,
      },
    };
  });
  return new Promise((resolve, reject) => {
    distributeJobs[distributionId] = new DistributeJob(
      distributionId,
      items,
      items.length * process.env.REPLICATION_FACTOR,
      wss.activeSockets,
      send,
      (data, err) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
};

const fetchDomain = async (domain) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!domain) {
        throw new Error("Domain not provided");
      }
      const hashedDomain = await mmh3(domain);
      const domainObj = await db.dbQueryOne("domains", {
        id: hashedDomain,
      });
      if (!domainObj) {
        throw new Error("Domain not registered or invalid");
      }
      // TODO: API base URI should be encrypted with proxy server public key
      // ... here we should decrypt it with the private key
      resolve(domainObj);
    } catch (e) {
      reject(e);
    }
  });
};

const registerApi = async (payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      const domainObj = await fetchDomain(payload.domain);
      const url = `${domainObj.baseApiUrl}/${domainObj.registerRoute}`;
      const secret = payload.requestBody[domainObj.secretKey];
      let id = payload.requestBody[domainObj.idKey];
      if (!secret || !id) {
        throw new Error("Invalid request body");
      }
      id = await mmh3(id);
      const bingoUser = await db.dbQueryOne("users", {
        id,
        domainId: domainObj.id,
      });
      if (bingoUser) {
        throw new Error("User already registered");
      }
      delete payload.requestBody[domainObj.secretKey];
      const res = await superagent
        .post(url)
        .send(payload.requestBody)
        .set("Content-Type", "application/json");
      if (res.status !== 201) {
        throw new Error(res.text);
      }
      resolve([domainObj, secret, id]);
    } catch (e) {
      reject(e);
    }
  });
};

const loginApi = async (payload, domainObj, secret) => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `${domainObj.baseApiUrl}/${domainObj.loginRoute}`;
      const res = await superagent
        .post(url)
        .send({
          ...payload.requestBody,
          [domainObj.secretKey]: {
            given: payload.requestBody[domainObj.secretKey],
            expected: secret,
          },
        })
        .set("Content-Type", "application/json");
      if (res.status !== 200) {
        throw new Error(res.text);
      }
      const { apiKey } = res.body;
      if (!apiKey) {
        throw new Error("Invalid response");
      }
      resolve([apiKey]);
    } catch (e) {
      reject(e);
    }
  });
};

const generateShares = async (secret, domainObj, id) => {
  return new Promise((resolve, reject) => {
    try {
      const shares = vss.getShares(
        secret,
        domainObj.shares,
        domainObj.threshold
      );
      let retShares = [];
      const replFactor =
        domainObj.replicationFactor || process.env.REPLICATION_FACTOR;
      for (let share of shares) {
        for (let r = 0; r < replFactor; r++) {
          retShares.push({
            domain: domainObj.id,
            share,
            id,
            shareId: uuidV4(),
          });
        }
      }
      resolve(retShares);
    } catch (e) {
      reject(e);
    }
  });
};

const distribute = async (items) => {
  if (!wss) {
    return Promise.reject(new Error("WSS not initialized"));
  }
  const distributionId = uuidV4();
  let distributionJob = promiseDistributeJob(distributionId, items);
  // TODO: send items to replication servers

  return distributionJob;
};

const retrieve = async (query) => {
  if (!wss) {
    return Promise.reject(new Error("WSS not initialized"));
  }
  const retrievalId = uuidV4();
  let retrievalJob = promiseRetrievalJob(
    retrievalId,
    query,
    parseInt(process.env.THRESHOLD)
  );
  return retrievalJob;
};

const acceptRetrievedData = async (wss, ws, json) => {
  const { messageId, data } = json;
  const { retrievalId, payload } = data;
  global.logger.debug(`Received retrieved data for retrieval ${retrievalId}`);
  try {
    if (!retrievalId) {
      global.logger.error(`Invalid retrievalId: ${retrievalId}`);
      return;
    }
    const job = retrievalJobs[retrievalId];
    if (!job) {
      global.logger.error(`Invalid retrievalId: ${retrievalId}`);
      return;
    }
    // TODO: check for dataType being retrieved
    if (job.active) {
      job.push(payload);
      global.logger.debug(`Retrieved data pushed to job: ${retrievalId}`);
    }
  } catch (e) {
    send(ws, {
      replyId: messageId,
      type: "error",
      error: e.message,
    });
    global.logger.error(e);
  }
};

const acceptDistributedAck = async (wss, ws, json) => {
  const { messageId, data } = json;
  const { distributionId } = data;
  global.logger.debug(`Received distributed ACK for distribution ${distributionId}`);
  try {
    if (!distributionId) {
      global.logger.error(`Invalid distributionId: ${distributionId}`);
      return;
    }
    const job = distributeJobs[distributionId];
    if (!job) {
      global.logger.error(`Invalid distributionId: ${distributionId}`);
      return;
    }
    if (job.active) {
      job.push(ws._id);
      global.logger.debug(`Distributed ACK pushed to job: ${distributionId} by ${ws._id}`);
    }
  } catch (e) {
    send(ws, {
      replyId: messageId,
      type: "error",
      error: e.message,
    });
    global.logger.error(e);
  }
}

const action = async (wss, ws, json) => {
  const { messageId, data } = json;
  const { actionId, payload } = data;

  try {
    global.logger.debug(`Received action ${actionId}`);
    switch (payload.action) {
      case "register": {
        const [domainObj, secret, id] = await registerApi(payload);
        const shares = await generateShares(secret, domainObj, id);
        await distribute(shares);
        await db.dbInsert("users", {
          id,
          domainId: domainObj.id,
        });
        send(ws, {
          replyId: messageId,
          type: "action-update",
          data: {
            actionId,
          },
        });
        break;
      }
      case "login": {
        const domainObj = await fetchDomain(payload.domain);
        const { idKey } = domainObj;
        let id = payload.requestBody[idKey];
        if (!id) {
          throw new Error("Invalid request body");
        }
        id = await mmh3(id);
        const bingoUser = await db.dbQueryOne("users", {
          id,
          domainId: domainObj.id,
        });
        if (!bingoUser) {
          throw new Error("Invalid user requested");
        }
        const secret = await retrieve({
          id,
          domain: domainObj.id,
        });
        const [apiKey] = await loginApi(payload, domainObj, secret);
        send(ws, {
          replyId: messageId,
          type: "action-update",
          data: {
            actionId,
            apiKey,
          },
        });
        break;
      }
      default:
        throw new Error("Invalid action request");
    }
  } catch (e) {
    send(ws, {
      replyId: messageId,
      type: "action-update",
      error: {
        message: e.message,
        actionId,
      },
    });
    global.logger.error(e);
  }
};

module.exports = {
  init: (options) => {
    const { server } = options;
    wss = new WSS({
      server,
    });

    wss._active = {};
    wss.activeSockets = () => Object.entries(wss._active);

    wss.on("connection", (ws) => {
      // Assign a unique ID to the client
      ws._id = uuidV4();
      send(ws, {
        type: "id",
        data: {
          id: ws._id,
        },
      });

      wss._active[ws._id] = ws;

      ws.on("message", (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
          case "echo":
            send(ws, {
              replyId: data.messageId,
              type: "echo",
              data: "OK",
            });
            break;
          case "action":
            action(wss, ws, data);
            break;
          case "retrieved":
            acceptRetrievedData(wss, ws, data);
            break;
          case "distributed":
            acceptDistributedAck(wss, ws, data);
            break;
          default:
            break;
        }
      });

      ws.on("close", () => {
        // TODO: should the user be purged from cache?
        // ... by making the user inactive we prevent the need for another 4-way handshake
        global.logger.info(`Client ${ws._id} disconnected`);
        delete wss._active[ws._id];
      });
    });
  },
};
