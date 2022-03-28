"use strict";

const config = require("./assets/config");

import Peer from "./peer";
import logger from "./logger";

let peer = null;

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

async function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.getSelected(null, function (tab) {
      resolve(tab);
    });
  });
}

const sendMessageToActiveTab = async (message, cb) => {
  try {
    let tab = await getCurrentTab();
    chrome.tabs.sendMessage(tab.id, message, null, cb);
  } catch (error) {
    logger.error(error);
    cb({
      type: "ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

// Only runs once when the browser starts
peer = new Peer(config.WSS_URI, sendMessageToActiveTab, (error) => {
  logger.error(error);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "LOGIN") {
    peer.addAction("login", request.payload, request.domain, (data, error) => {
      if (error) {
        sendResponse({
          type: "ERROR",
          error,
        });
      } else {
        sendResponse({
          type: "SUCCESS",
          data: data,
        });
      }
    });
    return true;
  }
  if (request.type === "REGISTER") {
    peer.addAction(
      "register",
      request.payload,
      request.domain,
      (data, error) => {
        if (error) {
          sendResponse({
            type: "ERROR",
            error,
          });
        } else {
          sendResponse({
            type: "OK",
            data: data,
          });
        }
      }
    );
    return true;
  }
});
