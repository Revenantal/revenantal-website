// @vitest-environment jsdom
import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { filterFreshData } from "@data/freshness";
import type { Site } from "@data/types";
import { ListView } from "./ListView";

const now = new Date("2026-10-18T12:00:00Z");
const site: Site = {
  projects: [],
  buttons: [
    { label: "SERVERS", face: "cream", action: "tune", channel: "status" },
    { label: "GUIDE", face: "grey", action: "tune", channel: "tv-guide" },
  ],
  servers: [],
  links: {
    steam: "https://example.invalid/",
    github: "https://example.invalid/",
    discord: "fixture",
  },
  credits: [],
  broadcast: {},
};

describe("list view", () => {
  it("turns the Status tune button into a link to the servers section", () => {
    render(
      <ListView
        site={site}
        view={filterFreshData(site, null, now)}
        now={now}
      />,
    );

    expect(
      screen.getByRole("link", { name: "SERVERS" }).getAttribute("href"),
    ).toBe("#servers");
    expect(screen.getByRole("heading", { name: "Game servers" }).id).toBe(
      "servers",
    );
    expect(screen.queryByText("GUIDE")).toBeNull();
  });
});
