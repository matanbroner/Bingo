const {
    getShares,
    reconstructSecret
} = require('./algo');

const replicators = process.env.REPLICATORS.split(',');
const replicationFactor = process.env.REPLICATION_FACTOR;
const n = parseInt(process.env.SHARES);
const t = parseInt(process.env.THRESHOLD);

