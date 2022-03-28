"use strict";

import logger from "./logger";

const { dbInit } = require("./db");
const config = require("./assets/config");

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

function injectHiddenTag() {
  var div = document.createElement("div");
  div.setAttribute("id", "bingo-installed");
  div.style.visibility = "hidden";
  document.body.appendChild(div);
}

const windowDomain = () => {
  return window.location.hostname;
};

injectHiddenTag();

const db = dbInit();

window.addEventListener("message", async function (event) {
  // We only accept messages from ourselves
  if (event.source != window || !event.data.type) return;

  if (event.data.type == "BINGO_MARCO") {
    window.postMessage({ type: "BINGO_POLO" }, "*");
  }
  if (event.data.type == "LOGIN") {
    chrome.runtime.sendMessage(
      { type: "LOGIN", domain: windowDomain(), payload: event.data.payload },
      function (response) {
        if (response.type == "SUCCESS") {
          window.postMessage(
            { type: "LOGIN_SUCCESS", payload: response.data },
            "*"
          );
        } else {
          window.postMessage(
            { type: "LOGIN_ERROR", error: response.error },
            "*"
          );
        }
      }
    );
  }
  if (event.data.type == "REGISTER") {
    chrome.runtime.sendMessage(
      { type: "REGISTER", domain: windowDomain(), payload: event.data.payload },
      function (response) {
        if (response.type == "OK") {
          console.log("Register response: " + JSON.stringify(response.data));
          window.postMessage(
            { type: "REGISTER_SUCCESS", payload: response.data },
            "*"
          );
        } else {
          window.postMessage(
            { type: "REGISTER_ERROR", error: response.error },
            "*"
          );
        }
      }
    );
  }
});

let domain = new URL(window.location.href).hostname;
domain = domain.replace("www.", "");

// Listen for message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === "DATA_STORE") {
    try {
      await db[request.table].put(request.payload);
      sendResponse({ type: "SUCCESS" });
    } catch (e) {
      logger.error(e);
      sendResponse({ type: "ERROR", error: e });
    }
  }
  if (request.type === "DATA_RETRIEVE") {
    try {
      const data = await db[request.table].where(request.payload).first();
      sendResponse({ type: "SUCCESS", data });
    } catch (e) {
      logger.error(e);
      sendResponse({ type: "ERROR", error: e });
    }
  }
  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});
