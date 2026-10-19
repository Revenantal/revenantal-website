import { describe, expect, it } from "vitest";
import {
  clientAddress,
  isPublicAddress,
  normaliseAddress,
  parsePeers,
} from "./client-address.ts";
import { createClientLimiter } from "./limits.ts";
import { createLru } from "./lru.ts";

describe("LRU cache", () => {
  const make = (now: () => number) =>
    createLru<string, string>({
      maxEntries: 3,
      maxBytes: 10,
      ttlMs: 1000,
      size: (value) => value.length,
      now,
    });

  it("evicts the least recently used entry at the entry or byte limit", () => {
    const cache = make(() => 0);
    cache.set("a", "1");
    cache.set("b", "1");
    cache.set("c", "1");
    expect(cache.get("a")).toBe("1");
    cache.set("d", "1");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.entries).toBe(3);

    cache.set("big", "12345678");
    expect(cache.bytes).toBeLessThanOrEqual(10);
    expect(cache.get("big")).toBe("12345678");
    cache.set("huge", "12345678901");
    expect(cache.get("huge")).toBeUndefined();
  });

  it("expires entries after their time to live", () => {
    let time = 0;
    const cache = make(() => time);
    cache.set("a", "1");
    time = 999;
    expect(cache.get("a")).toBe("1");
    time = 1000;
    expect(cache.get("a")).toBeUndefined();
    expect(cache.entries).toBe(0);
  });
});

describe("per-client limits", () => {
  it("allows the limit per minute, then refuses until the window resets", () => {
    let time = 0;
    const limiter = createClientLimiter(2, { now: () => time });
    expect([1, 2, 3].map(() => limiter.take("198.51.100.7"))).toEqual([
      true,
      true,
      false,
    ]);
    expect(limiter.take("192.0.2.9")).toBe(true);
    time = 60_000;
    expect(limiter.take("198.51.100.7")).toBe(true);
  });

  it("expires idle buckets and refuses new clients when every bucket is in use", () => {
    let time = 0;
    const limiter = createClientLimiter(5, { maxBuckets: 2, now: () => time });
    limiter.take("a");
    limiter.take("b");
    expect(limiter.take("c")).toBe(false);
    time = 10 * 60_000;
    expect(limiter.take("c")).toBe(true);
    expect(limiter.buckets).toBe(1);
  });
});

describe("visitor address", () => {
  const caddy = parsePeers("10.0.0.5, fd00::/8");

  it("accepts X-Real-IP only from a trusted peer, as one public address", () => {
    expect(clientAddress("10.0.0.5", "8.8.8.8", caddy)).toBe("8.8.8.8");
    expect(clientAddress("::ffff:10.0.0.5", "8.8.8.8", caddy)).toBe("8.8.8.8");
    expect(clientAddress("fd00::2", "2606:4700::1", caddy)).toBe(
      "2606:4700::1",
    );
    // Direct access, or any other peer, is never trusted.
    expect(clientAddress("10.0.0.6", "8.8.8.8", caddy)).toBeNull();
    expect(clientAddress("8.8.4.4", "8.8.8.8", caddy)).toBeNull();
    expect(clientAddress(undefined, "8.8.8.8", caddy)).toBeNull();
  });

  it("fails closed on missing, repeated, malformed or non-public addresses", () => {
    for (const header of [
      undefined,
      ["8.8.8.8", "1.1.1.1"],
      "8.8.8.8, 1.1.1.1",
      "not-an-ip",
      "10.1.2.3",
      "127.0.0.1",
      "192.168.1.4",
      "100.64.0.1",
      "169.254.1.1",
      "203.0.113.4",
      "::1",
      "fe80::1",
      "fc00::1",
      "2001:db8::1",
    ])
      expect(
        clientAddress("10.0.0.5", header, caddy),
        String(header),
      ).toBeNull();
  });

  it("trusts nobody when unset and rejects malformed peer settings", () => {
    expect(
      clientAddress("10.0.0.5", "8.8.8.8", parsePeers(undefined)),
    ).toBeNull();
    expect(() => parsePeers("10.0.0.0/33")).toThrow();
    expect(() => parsePeers("caddy")).toThrow();
    expect(normaliseAddress(" 8.8.8.8 ")).toBe("8.8.8.8");
    expect(isPublicAddress("1.1.1.1")).toBe(true);
    expect(isPublicAddress("::ffff:a00:1")).toBe(false);
  });
});
