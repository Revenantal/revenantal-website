import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { checkProject } from "./project-check.ts";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(() => Promise.resolve([{ address: "8.8.8.8", family: 4 }])),
}));
vi.mock("node:https", () => ({
  request: vi.fn((_url, _options, complete: (response: unknown) => void) => {
    const request = new EventEmitter();
    return Object.assign(request, {
      end: () => {
        complete({ statusCode: 200, resume: () => undefined });
      },
    });
  }),
}));

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
});
