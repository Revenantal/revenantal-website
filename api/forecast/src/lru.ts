/** Cache limits: entries, total bytes and age. */
export type LruOptions<V> = {
  maxEntries: number;
  maxBytes: number;
  ttlMs: number;
  size: (value: V) => number;
  now?: () => number;
};

/** A small least-recently-used cache. */
export type Lru<K, V> = {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  readonly entries: number;
  readonly bytes: number;
};

/**
 * Creates an LRU cache that evicts the least recently used entry at either limit and drops
 * expired entries when read. A value larger than the byte limit is not stored.
 *
 * @param options - Limits and the value size function.
 * @returns The cache.
 */
export function createLru<K, V>(options: LruOptions<V>): Lru<K, V> {
  const now = options.now ?? Date.now;
  const map = new Map<K, { value: V; size: number; expires: number }>();
  let bytes = 0;
  const remove = (key: K) => {
    const entry = map.get(key);
    if (!entry) return;
    bytes -= entry.size;
    map.delete(key);
  };
  return {
    get(key) {
      const entry = map.get(key);
      if (!entry) return undefined;
      if (entry.expires <= now()) {
        remove(key);
        return undefined;
      }
      // Re-insert to mark it most recently used.
      map.delete(key);
      map.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      remove(key);
      const size = options.size(value);
      if (size > options.maxBytes) return;
      map.set(key, { value, size, expires: now() + options.ttlMs });
      bytes += size;
      while (map.size > options.maxEntries || bytes > options.maxBytes) {
        const oldest = map.keys().next();
        if (oldest.done) break;
        remove(oldest.value);
      }
    },
    get entries() {
      return map.size;
    },
    get bytes() {
      return bytes;
    },
  };
}
