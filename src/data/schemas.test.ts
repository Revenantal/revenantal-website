import { describe, expect, it } from "vitest";
import {
  buttonInputSchema,
  liveServerSchema,
  playlistSchema,
  siteSchema,
  webUrlSchema,
} from "./schemas";

const project = {
  id: "fixture",
  name: "Fixture",
  type: "sandbox",
  url: "https://example.invalid/",
  host: "example.invalid",
  desc: "Fixture project",
};
const site = {
  projects: [project],
  buttons: [],
  servers: [],
  links: {
    steam: "https://example.invalid/steam",
    github: "https://example.invalid/github",
    discord: "fixture",
  },
  credits: [],
  broadcast: {},
};
const item = {
  id: "fixture",
  title: "Fixture",
  src: "/media/fixture.m3u8",
  durationSec: 60,
  captions: [{ src: "/media/fixture.vtt", language: "en", label: "English" }],
};

describe("content validation", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,fixture",
    "https://user:secret@example.invalid",
    "https://example.invalid/\nsecret",
  ])("rejects unsafe links: %s", (url) => {
    expect(webUrlSchema.safeParse(url).success).toBe(false);
  });
  it("rejects duplicate IDs and misspelled fields", () => {
    expect(
      siteSchema.safeParse({ ...site, projects: [project, project] }).success,
    ).toBe(false);
    expect(
      siteSchema.safeParse({ ...site, projects: [{ ...project, hiden: true }] })
        .success,
    ).toBe(false);
  });
  it("rejects ambiguous button actions", () => {
    expect(
      buttonInputSchema.safeParse({
        label: "Fixture",
        face: "cream",
        href: "https://example.invalid/",
        action: "tune",
        channel: "fixture",
      }).success,
    ).toBe(false);
  });
  it.each([
    { ...item, durationSec: Number.POSITIVE_INFINITY },
    { ...item, durationSec: 0 },
    { ...item, captions: [] },
    { ...item, src: "//example.invalid/media.m3u8" },
    { ...item, src: "javascript:alert(1)" },
  ])("rejects invalid broadcast media", (invalid) => {
    expect(
      playlistSchema.safeParse({
        startsAt: "2026-10-18T00:00:00Z",
        items: [invalid],
      }).success,
    ).toBe(false);
  });
  it("requires an offset and unique programme IDs", () => {
    expect(
      playlistSchema.safeParse({
        startsAt: "2026-10-18T00:00:00",
        items: [item],
      }).success,
    ).toBe(false);
    expect(
      playlistSchema.safeParse({
        startsAt: "2026-10-18T00:00:00Z",
        items: [item, item],
      }).success,
    ).toBe(false);
  });
  it("rejects player names and raw server objects", () => {
    expect(
      liveServerSchema.safeParse({
        id: "fixture",
        name: "Fixture",
        game: "Fixture",
        state: "running",
        playerNames: ["Private"],
      }).success,
    ).toBe(false);
  });
});
