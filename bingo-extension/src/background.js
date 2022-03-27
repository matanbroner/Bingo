"use strict";

const config = require("./assets/config");

import Peer from "./peer";
import logger from "./logger";

let peer = null;

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// Only runs once when the browser starts
chrome.runtime.onStartup.addListener(async () => {
  peer = new Peer(config.WSS_URI, (error) => {
    logger.error(error);
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "LOGIN") {
    peer.addAction("login", request.payload, request.domain, (data, err) => {
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
    peer.addAction("register", request.payload, request.domain, (data, err) => {
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
    });
    return true;
  }
});
