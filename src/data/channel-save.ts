/** JSON-only values a channel may save. Structurally the same as the host interface's `JsonValue`. */
export type SaveValue =
  null | boolean | number | string | SaveValue[] | { [key: string]: SaveValue };

/** One channel's save access, already scoped to its ID. */
export type ChannelSaveAccess = {
  load: <T>(version: number, parse: (value: unknown) => T | null) => T | null;
  store: (version: number, value: SaveValue) => boolean;
  reset: () => boolean;
};

/** The storage surface saves use; any call may throw when storage is blocked or full. */
export type SaveStorage = Pick<Storage, "getItem" | "setItem"> &
  Partial<Pick<Storage, "removeItem">>;

/** Every save lives under this prefix plus the channel ID. */
export const SAVE_PREFIX = "rv-save-";
/** Largest stored envelope, in characters. A save is progress, not a database. */
export const MAX_SAVE_CHARS = 100_000;
const MAX_DEPTH = 24;

/**
 * Whether a value is finite JSON data: no undefined, functions, NaN, Infinity, class
 * instances or cycles (deep nesting is rejected).
 *
 * @param value - Any value.
 * @param depth - Current nesting depth.
 * @returns True if it can be saved and read back unchanged.
 */
export function isSaveValue(value: unknown, depth = 0): value is SaveValue {
  if (depth > MAX_DEPTH) return false;
  if (value === null) return true;
  switch (typeof value) {
    case "boolean":
    case "string":
      return true;
    case "number":
      return Number.isFinite(value);
    case "object": {
      if (Array.isArray(value))
        return value.every((item) => isSaveValue(item, depth + 1));
      const prototype = Object.getPrototypeOf(value) as unknown;
      if (prototype !== Object.prototype && prototype !== null) return false;
      return Object.values(value).every((item) => isSaveValue(item, depth + 1));
    }
    default:
      return false;
  }
}

function envelopeData(raw: string, version: number): unknown {
  if (raw.length > MAX_SAVE_CHARS) return undefined;
  const envelope = JSON.parse(raw) as unknown;
  if (
    typeof envelope !== "object" ||
    envelope === null ||
    Array.isArray(envelope)
  )
    return undefined;
  const { version: stored, data } = envelope as Record<string, unknown>;
  return stored === version ? data : undefined;
}

/**
 * Creates one channel's save access under `rv-save-<channelId>`. The stored value is a
 * versioned envelope; `load` returns null for anything absent, from another version,
 * malformed, or rejected by the channel's own parser. Every storage and parser failure is
 * contained.
 *
 * @param storage - Browser storage, if available.
 * @param channelId - The channel's manifest ID.
 * @returns Load, store and reset for that one channel.
 */
export function createChannelSave(
  storage: SaveStorage | undefined,
  channelId: string,
): ChannelSaveAccess {
  const key = `${SAVE_PREFIX}${channelId}`;
  return {
    load: <T>(version: number, parse: (value: unknown) => T | null) => {
      try {
        const raw = storage?.getItem(key);
        if (raw === null || raw === undefined) return null;
        const data = envelopeData(raw, version);
        return data === undefined ? null : parse(data);
      } catch {
        return null;
      }
    },
    store: (version, value) => {
      if (!Number.isSafeInteger(version) || version < 0) return false;
      if (!isSaveValue(value)) return false;
      try {
        const raw = JSON.stringify({ version, data: value });
        if (raw.length > MAX_SAVE_CHARS || !storage) return false;
        storage.setItem(key, raw);
        return true;
      } catch {
        return false;
      }
    },
    reset: () => {
      try {
        if (!storage?.removeItem) return false;
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };
}
