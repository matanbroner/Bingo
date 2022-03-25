"use strict";

const keypair = require("keypair");
const uuidV4 = require("uuid").v4;
const db = require("./db");

import Peer from "./peer";
import logger from "./logger";

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

let peer = null;

async function setupDeviceId() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("deviceId", function (result) {
      let deviceId = result.deviceId;
      if (typeof deviceId === "undefined") {
        logger.info("No device ID found");
        // No keys found, generate new ones
        const deviceId = uuidV4();
        chrome.storage.sync.set({ deviceId }, function () {
          logger.info("New device ID generated: " + deviceId);
          resolve(deviceId);
        });
      } else {
        logger.info("Existing device ID found");
        resolve(deviceId);
      }
    });
  });
}

async function setupKeys() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("keys", function (result) {
      let keys = result.keys;
      if (typeof keys === "undefined") {
        logger.info("No keys found");
        // No keys found, generate new ones
        const keys = keypair();
        chrome.storage.sync.set({ keys }, function () {
          logger.info("New keys generated");
          resolve(keys);
        });
      } else {
        logger.info("Existing keys found");
        resolve(keys);
      }
    });
  });
}

// Only runs once when the browser starts
chrome.runtime.onStartup.addListener(async () => {
  // Initialize database
  db.dbInit("shares", "id");
  // Initialize a device ID if it doesn't exist
  // TODO: figure out a better way to create a persistent ID which
  // ... even an advanced user cannot remove
  await setupDeviceId();
  // Initialize keys if they don't exist
  await setupKeys();
  // Initialize peer
  peer = new Peer(
    
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.info("Got message: " + request);
  if (request.type === "GREETINGS") {
    const message = `Hi ${
      sender.tab ? "Con" : "Pop"
    }, my name is Back. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
  }
});
