const _ = require("lodash");

const RETRIEVAL_TIMEOUT = process.env.RETRIEVAL_TIMEOUT
  ? parseInt(process.env.RETRIEVAL_TIMEOUT)
  : 10000;

const DISTRIBUTE_TIMEOUT = process.env.DISTRIBUTE_TIMEOUT
  ? parseInt(process.env.DISTRIBUTE_TIMEOUT)
  : 10000;

const RETRY_ATTEMPTS = process.env.RETRY_ATTEMPTS
  ? parseInt(process.env.RETRY_ATTEMPTS)
  : 3;

class RetrievalJob {
  constructor(id, query, threshold, getCandidates, send, cb) {
    this.id = id;
    this.cb = cb;
    this.query = query;
    this.threshold = threshold;
    this.createdAt = new Date();
    this.completedAt = null;
    this.data = new Set();
    this.active = false;
    this.parentSend = send;
    this.getCandidates = getCandidates;
    this.attempts = RETRY_ATTEMPTS;
    this._start();
  }

  push(data) {
    this.data.add(data);
    this.updatedAt = new Date();
    global.logger.debug(
      `Retrieval job ${this.id} data pushed: ${data}, now has ${this.data.size} items`
    );
    if (this.data.size >= this.threshold) {
      this._complete();
    }
  }

  _start() {
    let that = this;
    this.active = true;
    this.updatedAt = new Date();
    this._send();
    this.timeout = setTimeout(() => {
      if (that.attempts > 0) {
        that.attempts--;
        that._start();
      } else {
        that.cb(null, "Retrieval timed out");
      }
    }, RETRIEVAL_TIMEOUT * Math.pow(2, RETRY_ATTEMPTS - that.attempts));
  }

  _send() {
    let candidates = this.getCandidates();
    if (candidates.length === 0) {
      return;
    }
    let remaining = this.threshold - this.data.size;
    if (remaining === 0) {
      return;
    }
    // TODO: make the retieve mechanism more efficient
    // ... once we have a better distribution mechanism we can query only specific peers
    // ... for now we query all peers
    for (let [_, ws] of candidates) {
      this.parentSend(ws, this.query);
    }
  }

  _complete() {
    clearTimeout(this.timeout);
    this.completedAt = new Date();
    this.active = false;
    this.cb && this.cb(Array.from(this.data));
  }
}

class DistributeJob {
  constructor(id, data, count, getCandidates, send, cb) {
    this.id = id;
    this.cb = cb;
    this.data = data;
    this.count = count;
    this.active = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
    this.attempts = RETRY_ATTEMPTS;
    this.usedCandidates = {};
    this.ackedCandidates = new Set();
    this.getCandidates = getCandidates;
    this.parentSend = send;
    this._start();
  }

  push(id) {
    if (id in this.usedCandidates) {
      this.ackedCandidates.add(id);
      this.updatedAt = new Date();
      global.logger.debug(
        `Distribute job ${this.id} acked candidate: ${id}, now has ${this.ackedCandidates.size} acked`
      );
      if (this.ackedCandidates.size >= this.count) {
        this._complete();
      }
    }
  }

  _complete() {
    clearTimeout(this.timeout);
    this.completedAt = new Date();
    this.active = false;
    this.cb && this.cb(this.data);
  }

  _start() {
    let that = this;
    this.active = true;
    this.updatedAt = new Date();
    this._send();
    this.timeout = setTimeout(() => {
      if (that.attempts > 0) {
        that.attempts--;
        that._start();
      } else {
        that.cb(null, "Distribution timed out");
      }
    }, DISTRIBUTE_TIMEOUT * Math.pow(2, RETRY_ATTEMPTS - that.attempts));
  }

  _send() {
    let candidates = this.getCandidates();
    if (candidates.length === 0) {
      return;
    }
    let remaining = this.count - this.ackedCandidates.size;
    if (remaining === 0) {
      return;
    }
    let sentToCandiates = [];
    let ackedData = [...this.ackedCandidates].map((id) => {
      return this.usedCandidates[id];
    });
    let remainingData = this.data.filter((data) => {
      return !ackedData.includes(data.shareId);
    });
    // TODO: improve distribution mechanism
    // ... currently we distribute to n random peers
    // ... this later requires querying all peers to retrieve the data
    // ... We choose the number of peers based on a replication factor

    // TODO: backlog distribution jobs if not enough peers are available
    while (
      sentToCandiates.length < remaining &&
      remainingData.length > 0 &&
      candidates.length > 0
    ) {
      let [id, ws] = _.sample(candidates);
      // remove the candidate from the list
      candidates = candidates.filter(([_id, _]) => {
        return _id !== id;
      });
      if (id in this.usedCandidates) {
        continue;
      }
      let sendDataItem = remainingData.pop();
      if (sendDataItem) {
        this.parentSend(ws, sendDataItem);
        sentToCandiates.push(id);
        this.usedCandidates[id] = sendDataItem.shareId;
      } else {
        break;
      }
    }
  }
}

module.exports = {
  RetrievalJob,
  DistributeJob,
};
