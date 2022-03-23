class RetrievalJob {
  constructor(id, query, threshold, cb) {
    this.id = id;
    this.cb = cb;
    this.query = query;
    this.threshold = threshold;
    this.active = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
    this.data = new Set();
  }

  push(data) {
    this.data.add(data);
    this.updatedAt = new Date();
    global.logger.debug(`Retrieval job ${this.id} data pushed: ${data}, now has ${this.data.size} items`);
    if (this.data.size >= this.threshold) {
      this._complete();
    }
  }

  _complete() {
    this.completedAt = new Date();
    this.active = false;
    this.cb && this.cb(Array.from(this.data));
  }
}

module.exports = {
  retrieval: RetrievalJob,
};
