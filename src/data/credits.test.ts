import { describe, expect, it } from "vitest";
import { groupCredits } from "./credits";
import type { Credit } from "./types";

const credit = (title: string, department: string): Credit => ({
  title,
  department,
  author: "Author",
  url: "https://example.invalid/",
  license: "CC0 1.0",
  usedFor: "testing",
});

describe("groupCredits", () => {
  it("groups by department in first-seen order and keeps entry order", () => {
    expect(
      groupCredits([
        credit("a", "Sound"),
        credit("b", "Art"),
        credit("c", "Sound"),
      ]),
    ).toEqual([
      {
        department: "Sound",
        credits: [credit("a", "Sound"), credit("c", "Sound")],
      },
      { department: "Art", credits: [credit("b", "Art")] },
    ]);
  });

  it("returns no groups for no credits", () => {
    expect(groupCredits([])).toEqual([]);
  });
});
