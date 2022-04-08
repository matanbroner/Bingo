# Bingo

<p align="center">
  <img src="logo.png" alt="logo" width="200"/>
</p>

A distributed password storage mechanism using verifiable secret sharing

## What is Bingo?

Bingo is a distributed password storage mechanism using verifiable secret sharing. It provides a proxy server that is used to middleman all requests to register and login to a third party service. Users that rely on Bingo install its accompanying browser extension which communicates with the proxy server, and stores shares of other users' secrets, such as password.

## How does Bingo work?

Users with the Bingo browser extension installed connect to the proxy server using a WebSocket connection. The WebSocket verifies the correct installation of the extension and communicates with Bingo's embedded UI elements when a registration or login is requested. Just as modern 2FA services use an embedded UI to communicate with their servers, Bingo's UI elements do not contact a third party's central server directly, rather they communicate with the proxy server.

## Deploying Bingo
Bingo is still in early development. Propoer deployment instructions to come.

## Source Code Directories

<ul>
  <li>
    `bingo-extension`: The browser extension that provides the user interface for Bingo. Currrently the only supported platform is Chrome.
  </li>
  <li>
    `bingo-server`: A simple REST server with an exposed /register and /login API, which serves as an example of the way a third party should configure its API to work with Bingo.
  </li>
  <li>
    `bingo-ui`: The UI elements that are used to communicate with the proxy server. A sample application is provided to show how UI elements should be configured to communicate with the browser extension.
  </li>
  <li>
    `proxy`: The proxy server that is used to communicate with the third party service. Most of the important functionality for Bingo and configuration for a deployment is found here.
  </li>
  <li>
    `relay`: A simple relay server which Bingo can optionally deploy to store shares of other users' secrets. This can improve performance by making stronger guarantees of a user's ability to succesfully register and login.
  </li>
  <li>
    `tools`: A set of tools used by Bingo. These should not be tampered with during deployment.
  </li>
</ul>
