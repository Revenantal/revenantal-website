import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { checkProject } from "./project-check.ts";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(() => Promise.resolve([{ address: "8.8.8.8", family: 4 }])),
}));
const reply = vi.hoisted(() => ({ statusCode: 200 }));
vi.mock("node:https", () => ({
  request: vi.fn((_url, _options, complete: (response: unknown) => void) => {
    const request = new EventEmitter();
    return Object.assign(request, {
      end: () => {
        complete({ statusCode: reply.statusCode, resume: () => undefined });
      },
    });
  }),
}));

const fixture = {
  id: "fixture",
  name: "Fixture",
  type: "sandbox" as const,
  url: "https://example.invalid/",
  host: "example.invalid",
  desc: "Fixture",
};

describe("public availability checks", () => {
  it("uses a valid integer deadline after fractional DNS elapsed time", async () => {
    const result = await checkProject({
      id: "fixture",
      name: "Fixture",
      type: "sandbox",
      url: "https://example.invalid/",
      host: "example.invalid",
      desc: "Fixture",
    });
    expect(result.state).toBe("up");
    expect(result.ms).toBeGreaterThanOrEqual(0);
  });

  it("counts a rate-limited answer as reachable, and errors as down", async () => {
    for (const [statusCode, state] of [
      [429, "up"],
      [404, "down"],
      [503, "down"],
    ] as const) {
      reply.statusCode = statusCode;
      expect((await checkProject(fixture)).state, String(statusCode)).toBe(
        state,
      );
    }
    reply.statusCode = 200;
  });
});
