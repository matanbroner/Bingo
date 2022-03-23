const RETRIEVAL_TIMEOUT = process.env.RETRIEVAL_TIMEOUT
  ? parseInt(process.env.RETRIEVAL_TIMEOUT)
  : 10000;

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
    this.timeout = setTimeout(() => {
      this.cb(null, new Error("Retrieval job timed out"));
    }, RETRIEVAL_TIMEOUT);
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

  _complete() {
    clearTimeout(this.timeout);
    this.completedAt = new Date();
    this.active = false;
    this.cb && this.cb(Array.from(this.data));
  }
}

module.exports = {
  retrieval: RetrievalJob,
};
