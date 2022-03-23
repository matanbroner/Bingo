class MemoryCache {
  constructor() {
    this._cache = {};
  }

  set(key, value) {
    this._cache[key] = value;
  }
  get(key) {
    return this._cache[key];
  }
  delete(key) {
    delete this._cache[key];
  }
  clear() {
    this._cache = {};
  }

  active() {
    return Object.entries(this._cache).filter(([key, value]) => value.active);
  }
}

module.exports = {
  MemoryCache,
};
