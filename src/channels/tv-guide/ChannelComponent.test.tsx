// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { channelProps, fixtureProjects } from "../_shared/testing/fixtures";
import { ChannelComponent } from "./ChannelComponent";
import { forgetForecast } from "./weather";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  forgetForecast();
});

describe("TV Guide", () => {
  it("lists every project as a new-tab link, named for screen readers", () => {
    render(
      <ChannelComponent {...channelProps({ projects: fixtureProjects(3) })} />,
    );
    const link = screen.getByRole("link", {
      name: /^Project 2, status unknown\./,
    });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(
      screen.getAllByRole("link", { name: /opens in a new tab/ }),
    ).toHaveLength(3);
  });

  it("tunes to other channels from the listings through the host", () => {
    const props = channelProps();
    render(<ChannelComponent {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /^CH 10, STATUS:/ }));
    expect(props.host.tune).toHaveBeenCalledWith("status");
  });

  it("shows soft static while the forecast is unavailable, never a fixed city", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 503 }))),
    );
    render(<ChannelComponent {...channelProps()} />);
    const window = screen.getByRole("region", { name: "Local forecast" });
    expect(await screen.findByText("Forecast not available")).toBeTruthy();
    expect(window.querySelector("canvas")).not.toBeNull();
  });

  it("skips weather entirely for Do Not Track", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    Object.defineProperty(navigator, "doNotTrack", {
      value: "1",
      configurable: true,
    });
    try {
      render(<ChannelComponent {...channelProps()} />);
      expect(await screen.findByText("Forecast not available")).toBeTruthy();
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(navigator, "doNotTrack");
    }
  });

  it("shows the forecast with readable, keyboard-reachable credits and the privacy note", async () => {
    const forecast = {
      city: "Toronto",
      country: "CA",
      units: "C",
      windUnit: "km/h",
      latitude: 43.65,
      longitude: -79.38,
      observedAt: "2026-10-19T18:15:00.000Z",
      current: {
        temperature: 12,
        feelsLike: 10,
        humidity: 64,
        weatherCode: 2,
        windSpeed: 14,
        windDirection: 315,
        isDay: true,
      },
      daily: [
        {
          date: "2026-10-19",
          high: 13,
          low: 5,
          weatherCode: 3,
          precipitationChance: 10,
        },
        {
          date: "2026-10-20",
          high: 9,
          low: 3,
          weatherCode: 61,
          precipitationChance: 80,
        },
      ],
    };
    const fetch = vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/forecast"
          ? new Response(JSON.stringify(forecast), { status: 200 })
          : new Response(null, { status: 503 }),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<ChannelComponent {...channelProps()} />);
    expect(
      await screen.findByText(
        /^Local forecast for Toronto: 12 degrees Celsius, partly cloudy\. Feels like 10\. Humidity 64 percent\. Wind NW 14 km\/h\./,
      ),
    ).toBeTruthy();
    for (const name of [
      "Open-Meteo.com",
      "RainViewer",
      "DB-IP",
      "Natural Earth",
    ])
      expect(screen.getByRole("link", { name }).getAttribute("target")).toBe(
        "_blank",
      );
    fireEvent.click(screen.getByRole("button", { name: "Privacy" }));
    expect(screen.getByRole("note").textContent).toContain(
      "We do not save it.",
    );
    expect(fetch.mock.calls.every(([url]) => url.startsWith("/"))).toBe(true);
  });

  it("drifts the listings only while active and not hovered, and keeps a second copy out of reach", () => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame"],
    });
    const props = channelProps({ projects: fixtureProjects(30) });
    const { container, rerender } = render(<ChannelComponent {...props} />);
    const track =
      container.querySelector<HTMLElement>("[data-copy]")?.parentElement;
    if (!track) throw new Error("no scrolling track");
    void act(() => {
      vi.advanceTimersByTime(1000);
    });
    const moved = track.style.transform;
    expect(moved).toMatch(/translate3d\(0(px)?, -\d/);

    const copy = container.querySelector("[data-copy]");
    expect(copy?.getAttribute("aria-hidden")).toBe("true");
    expect(copy?.querySelector("a")?.getAttribute("tabindex")).toBe("-1");

    fireEvent.pointerEnter(screen.getByRole("region", { name: "Listings" }));
    void act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(track.style.transform).toBe(moved);

    fireEvent.pointerLeave(screen.getByRole("region", { name: "Listings" }));
    rerender(<ChannelComponent {...props} active={false} />);
    void act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(track.style.transform).toBe(moved);
  });

  it("holds a still, manually scrollable list for reduced motion", () => {
    const { container } = render(
      <ChannelComponent
        {...channelProps({
          projects: fixtureProjects(30),
          reducedMotion: true,
        })}
      />,
    );
    expect(container.querySelector("[data-copy]")).toBeNull();
    expect(container.firstElementChild?.getAttribute("data-motion")).toBe(
      "reduced",
    );
  });

  it("reads the ticker once to screen readers", () => {
    render(<ChannelComponent {...channelProps()} />);
    expect(screen.getByRole("list", { name: "News" }).textContent).toContain(
      "revenantal has been playing Game 1 lately",
    );
  });
});
