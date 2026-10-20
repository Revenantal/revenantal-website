import { describe, expect, it } from "vitest";
import { clientAddress, parsePeers } from "./client-address.ts";
import { parsePeerHosts, trustedPeers } from "./trusted-peers.ts";

describe("trusted peer host names", () => {
  it("trusts the addresses a name resolves to, following them on refresh", async () => {
    let address = "10.0.1.5";
    const trust = trustedPeers(parsePeers(undefined), ["site"], (host) =>
      Promise.resolve(host === "site" ? [{ address }] : []),
    );
    // Nothing is trusted before the first lookup.
    expect(clientAddress("10.0.1.5", "8.8.8.8", trust.peers)).toBeNull();
    await trust.refresh();
    expect(clientAddress("10.0.1.5", "8.8.8.8", trust.peers)).toBe("8.8.8.8");
    // Another container on the same network, such as Coolify's proxy, is not trusted.
    expect(clientAddress("10.0.1.9", "8.8.8.8", trust.peers)).toBeNull();
    // The site restarts with a new address: the old one stops being trusted.
    address = "10.0.1.7";
    await trust.refresh();
    expect(clientAddress("10.0.1.5", "8.8.8.8", trust.peers)).toBeNull();
    expect(clientAddress("10.0.1.7", "8.8.8.8", trust.peers)).toBe("8.8.8.8");
  });

  it("trusts nobody for a name that does not resolve, and keeps fixed peers", async () => {
    const trust = trustedPeers(parsePeers("10.0.0.5"), ["site"], () =>
      Promise.reject(new Error("not found")),
    );
    await trust.refresh();
    expect(clientAddress("10.0.0.5", "8.8.8.8", trust.peers)).toBe("8.8.8.8");
    expect(clientAddress("10.0.1.5", "8.8.8.8", trust.peers)).toBeNull();
  });

  it("parses names and rejects anything else", () => {
    expect(parsePeerHosts(" site , weather-api ")).toEqual([
      "site",
      "weather-api",
    ]);
    expect(parsePeerHosts(undefined)).toEqual([]);
    expect(() => parsePeerHosts("site/1")).toThrow();
    expect(() => parsePeerHosts("-site")).toThrow();
  });
});
