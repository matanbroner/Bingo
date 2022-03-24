"use strict";

const keypair = require("keypair");

import logger from "./logger";

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// Only runs once when the browser starts
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get("keys", function (result) {
    let keys = result.keys;
    if (typeof keys === "undefined") {
      logger.info("No key pair found");
      // No keys found, generate new ones
      const keys = keypair(3072);
      console.log(keys);
      chrome.storage.sync.set({ keys }, function () {
        logger.info("New key pair generated");
      });
    } else {
      logger.info("Key pair found");
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  logger.info("Got message: ", request);
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
