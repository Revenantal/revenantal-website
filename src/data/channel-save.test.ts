import { describe, expect, it } from "vitest";
import {
  MAX_SAVE_CHARS,
  createChannelSave,
  isSaveValue,
  type SaveStorage,
} from "./channel-save";

function memory(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const keep = (value: unknown) => value as { xp: number } | null;

describe("isSaveValue", () => {
  it("accepts finite JSON data", () => {
    expect(isSaveValue({ a: [1, "b", null, true], c: { d: 0 } })).toBe(true);
  });

  it("rejects what JSON cannot hold", () => {
    expect(isSaveValue(undefined)).toBe(false);
    expect(isSaveValue(Number.NaN)).toBe(false);
    expect(isSaveValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isSaveValue(() => 1)).toBe(false);
    expect(isSaveValue(new Date())).toBe(false);
    expect(isSaveValue({ a: undefined })).toBe(false);
    expect(isSaveValue(new Map())).toBe(false);
  });

  it("rejects cycles and very deep nesting", () => {
    const cycle: Record<string, unknown> = {};
    cycle["self"] = cycle;
    expect(isSaveValue(cycle)).toBe(false);
  });
});

describe("createChannelSave", () => {
  it("stores and loads a versioned envelope under rv-save-<id>", () => {
    const storage = memory();
    const save = createChannelSave(storage, "revscape");
    expect(save.store(1, { xp: 40 })).toBe(true);
    expect(JSON.parse(storage.data.get("rv-save-revscape") ?? "null")).toEqual({
      version: 1,
      data: { xp: 40 },
    });
    expect(save.load(1, keep)).toEqual({ xp: 40 });
  });

  it("keeps each channel in its own namespace", () => {
    const storage = memory();
    createChannelSave(storage, "a").store(1, { xp: 1 });
    expect(createChannelSave(storage, "b").load(1, keep)).toBeNull();
    createChannelSave(storage, "b").reset();
    expect(createChannelSave(storage, "a").load(1, keep)).toEqual({ xp: 1 });
  });

  it("returns null for absent, other-version and malformed saves", () => {
    const storage = memory();
    const save = createChannelSave(storage, "g");
    expect(save.load(1, keep)).toBeNull();
    save.store(1, { xp: 1 });
    expect(save.load(2, keep)).toBeNull();
    storage.data.set("rv-save-g", "not json");
    expect(save.load(1, keep)).toBeNull();
    storage.data.set("rv-save-g", JSON.stringify([1, 2]));
    expect(save.load(1, keep)).toBeNull();
    storage.data.set("rv-save-g", JSON.stringify({ version: 1 }));
    expect(save.load(1, (value) => value as null)).toBeNull();
  });

  it("returns null when the parser rejects or throws", () => {
    const storage = memory();
    const save = createChannelSave(storage, "g");
    save.store(1, { xp: 1 });
    expect(save.load(1, () => null)).toBeNull();
    expect(
      save.load(1, () => {
        throw new Error("bad shape");
      }),
    ).toBeNull();
  });

  it("refuses invalid values, versions and oversized saves", () => {
    const save = createChannelSave(memory(), "g");
    expect(save.store(1, Number.NaN)).toBe(false);
    expect(save.store(-1, { xp: 1 })).toBe(false);
    expect(save.store(1.5, { xp: 1 })).toBe(false);
    expect(save.store(1, "x".repeat(MAX_SAVE_CHARS))).toBe(false);
  });

  it("resets only its own save", () => {
    const storage = memory();
    const save = createChannelSave(storage, "g");
    save.store(1, { xp: 1 });
    expect(save.reset()).toBe(true);
    expect(save.load(1, keep)).toBeNull();
  });

  it("contains blocked, full and missing storage", () => {
    const blocked: SaveStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    const save = createChannelSave(blocked, "g");
    expect(save.load(1, keep)).toBeNull();
    expect(save.store(1, { xp: 1 })).toBe(false);
    expect(save.reset()).toBe(false);

    const none = createChannelSave(undefined, "g");
    expect(none.load(1, keep)).toBeNull();
    expect(none.store(1, { xp: 1 })).toBe(false);
    expect(none.reset()).toBe(false);

    const readOnly = createChannelSave(
      { getItem: () => null, setItem: () => undefined },
      "g",
    );
    expect(readOnly.reset()).toBe(false);
  });
});
