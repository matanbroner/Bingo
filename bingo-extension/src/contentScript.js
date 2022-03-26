"use strict";

import logger from "./logger";
import Peer from "./peer";

const db = require("./db");
const config = require("./assets/config");

let peer = null;

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

window.addEventListener("message", async function (event) {
  // We only accept messages from ourselves
  if (event.source != window) return;

  if (event.data.type && event.data.type == "BINGO_MARCO") {
    window.postMessage({ type: "BINGO_POLO" }, "*");
    db.dbInit("shares", "id");
    peer = new Peer(config.WSS_URI, (error) => {
      logger.error(error);
    });
  }
  const test = await db.dbGet("shares", "test");
  console.log(test);
});

// Log `title` of current active web page

const pageTitle = document.head.getElementsByTagName("title")[0].innerHTML;
console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});
