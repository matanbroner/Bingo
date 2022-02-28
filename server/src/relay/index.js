const relayGeo = require("./geo");

const relays = process.env.RELAYS.split(",");

const {
    relayLocations,
    closestRelay,
} = relayGeo(relays);