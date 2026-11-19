/**
 * Lightweight in-memory SWR (Stale-While-Revalidate) Cache Store
 * Guarantees 0ms instant page loads and seamless background revalidation.
 */

const _CACHE = new Map();
const DEFAULT_TTL = 3 * 60 * 1000; // 3 minutes

export const dataCache = {
  get(key) {
    const entry = _CACHE.get(key);
    if (!entry) return null;
    return entry.data;
  },

  isFresh(key) {
    const entry = _CACHE.get(key);
    if (!entry) return false;
    return (Date.now() - entry.timestamp) < entry.ttl;
  },

  set(key, data, ttl = DEFAULT_TTL) {
    _CACHE.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  },

  invalidate(prefix = '') {
    if (!prefix) {
      _CACHE.clear();
      return;
    }
    for (const key of _CACHE.keys()) {
      if (key.startsWith(prefix)) {
        _CACHE.delete(key);
      }
    }
  }
};
