const geoip = require("geoip-lite");

module.exports = (relays) => {
    const relayLocations = relays.map((relay) => {
        const ip = relay.split(":")[0];
        const location = geoip.lookup(ip);
        return {
            ip,
            location,
        };
    });
    return {
        relayLocations,
        closestRelay: (location) => {
            const distances = relayLocations.map((relay) => {
                const distance = Math.sqrt(
                    Math.pow(relay.location.latitude - location.latitude, 2) +
                        Math.pow(relay.location.longitude - location.longitude, 2)
                );
                return {
                    relay,
                    distance,
                };
            });
            distances.sort((a, b) => a.distance - b.distance);
            return distances[0].relay;
        },
    }
};