import { describe, expect, it, vi } from "vitest";
import { createCoalescer, createUpstream } from "./upstream.ts";

const ok = (body: string, init: ResponseInit = {}) =>
  Promise.resolve(new Response(body, { status: 200, ...init }));

const code = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return "ok";
  } catch (error) {
    return (error as { code?: string }).code;
  }
};

describe("upstream client", () => {
  it("only contacts the fixed HTTPS hosts, with fixed headers and no redirects", async () => {
    const fetch = vi.fn(() => ok("{}"));
    const upstream = createUpstream({ fetch });
    expect(await code(upstream.get(new URL("https://evil.example/"), 10))).toBe(
      "host_denied",
    );
    expect(
      await code(upstream.get(new URL("http://api.open-meteo.com/v1"), 10)),
    ).toBe("host_denied");
    expect(fetch).not.toHaveBeenCalled();

    await upstream.get(new URL("https://api.open-meteo.com/v1/forecast"), 10);
    const init = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(init[1].redirect).toBe("manual");
    expect(init[1].headers).toEqual({ Accept: "application/json, image/png" });
  });

  it("refuses redirects, error statuses and oversized bodies", async () => {
    const url = new URL("https://api.rainviewer.com/public/weather-maps.json");
    const respond = (response: Response) =>
      createUpstream({ fetch: () => Promise.resolve(response) }).get(url, 8);
    expect(
      await code(
        respond(
          new Response(null, { status: 302, headers: { Location: "x" } }),
        ),
      ),
    ).toBe("redirect_denied");
    expect(await code(respond(new Response("no", { status: 500 })))).toBe(
      "bad_status",
    );
    expect(await code(respond(new Response("123456789")))).toBe("too_large");
    expect(
      await code(
        respond(new Response("1", { headers: { "Content-Length": "999999" } })),
      ),
    ).toBe("too_large");
    expect(await respond(new Response("12345678"))).toHaveLength(8);
  });

  it("times out, reports network errors, and never retries", async () => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    const slow = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(Object.assign(new Error("t"), { name: "TimeoutError" }));
          });
        }),
    );
    expect(
      await code(createUpstream({ fetch: slow, timeoutMs: 10 }).get(url, 10)),
    ).toBe("timeout");
    expect(slow).toHaveBeenCalledTimes(1);
    expect(
      await code(
        createUpstream({ fetch: () => Promise.reject(new Error("down")) }).get(
          url,
          10,
        ),
      ),
    ).toBe("network");
  });

  it("allows at most eight in flight and 30 a minute across the service", async () => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    const waiting: (() => void)[] = [];
    const fetch = () =>
      new Promise<Response>((resolve) => {
        waiting.push(() => {
          resolve(new Response("{}"));
        });
      });
    const upstream = createUpstream({ fetch });
    const flights = Array.from({ length: 8 }, () => upstream.get(url, 10));
    expect(await code(upstream.get(url, 10))).toBe("busy");
    for (const release of waiting) release();
    await Promise.all(flights);

    let time = 0;
    const counted = createUpstream({ fetch: () => ok("{}"), now: () => time });
    for (let index = 0; index < 30; index += 1) await counted.get(url, 10);
    expect(await code(counted.get(url, 10))).toBe("rate_limited");
    time = 60_000;
    expect(await code(counted.get(url, 10))).toBe("ok");
  });

  it("shares one request per key while it is in flight", async () => {
    const coalesce = createCoalescer();
    const work = vi.fn(() => Promise.resolve(42));
    const results = await Promise.all([
      coalesce("city", work),
      coalesce("city", work),
    ]);
    expect(results).toEqual([42, 42]);
    expect(work).toHaveBeenCalledTimes(1);
    await coalesce("city", work);
    expect(work).toHaveBeenCalledTimes(2);
  });
});
