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

// Only runs once when the browser starts
chrome.runtime.onStartup.addListener(async () => {
  // Initialize database
  db.dbInit("shares", "id");
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
