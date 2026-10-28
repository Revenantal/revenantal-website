/** A text colour on the boot screens, taken from the VGA text palette. */
export type Tone = "dim" | "ok" | "warn" | "bright" | "red" | "logo";

/** A run of text in one tone. */
export type Segment = readonly [text: string, tone?: Tone];

/** One line of a boot screen. An empty line is a blank row. */
export type BootLine = readonly Segment[];

/** What the boot screen shows at one moment. */
export type BootFrame = {
  phase: "post" | "load" | "done";
  lines: BootLine[];
};

type Entry = {
  /** The time in ms at which the line appears. */
  at: number;
  line: BootLine | ((elapsed: number) => BootLine);
};

/** Time the power-on self test ends and the screen clears. */
const POST_END_MS = 3900;
/** A short blank beat while the "video mode" changes. */
const LOAD_START_MS = 3950;
/** When the boot hands over to the terminal. */
export const BOOT_DURATION_MS = 6100;

const MEMORY_START_MS = 600;
const MEMORY_COUNT_MS = 1200;
const MEMORY_TOTAL_K = 640;

const BAR_START_MS = 4100;
const BAR_END_MS = 5800;
const BAR_WIDTH = 40;

const BLANK: BootLine = [];

/** Four-column block letters, five rows tall, for the loading-screen logo. */
const GLYPHS: Record<string, readonly string[]> = {
  R: ["███ ", "█  █", "███ ", "█ █ ", "█  █"],
  E: ["████", "█   ", "███ ", "█   ", "████"],
  V: ["█  █", "█  █", "█  █", "█  █", " ██ "],
  N: ["█  █", "██ █", "█ ██", "█  █", "█  █"],
  A: [" ██ ", "█  █", "████", "█  █", "█  █"],
  T: ["████", " ██ ", " ██ ", " ██ ", " ██ "],
  L: ["█   ", "█   ", "█   ", "█   ", "████"],
};

/**
 * Draws a word in five-row block letters.
 *
 * @param word - Upper-case letters; any without a glyph are left blank.
 * @returns The five rows of text.
 */
export function blockWord(word: string): string[] {
  return Array.from({ length: 5 }, (_, row) =>
    Array.from(word, (letter) => GLYPHS[letter]?.[row] ?? "    ").join(" "),
  );
}

/**
 * How much of a span has passed.
 *
 * @param elapsed - Milliseconds since the boot started.
 * @param start - When the span starts, in the same milliseconds.
 * @param end - When the span ends.
 * @returns The share covered, from 0 to 1.
 */
function progress(elapsed: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (elapsed - start) / (end - start)));
}

function memoryLine(elapsed: number): BootLine {
  const counted = Math.round(
    MEMORY_TOTAL_K *
      progress(elapsed, MEMORY_START_MS, MEMORY_START_MS + MEMORY_COUNT_MS),
  );
  const count = `${String(counted).padStart(3, " ")}K`;
  return counted >= MEMORY_TOTAL_K
    ? [["Base Memory      : "], [count, "bright"], [" OK", "ok"]]
    : [["Base Memory      : "], [count, "bright"]];
}

function barLine(elapsed: number): BootLine {
  const share = progress(elapsed, BAR_START_MS, BAR_END_MS);
  const filled = Math.round(BAR_WIDTH * share);
  const bar = `${"█".repeat(filled)}${"░".repeat(BAR_WIDTH - filled)}`;
  return [
    [
      ` [${bar}] ${String(Math.round(share * 100)).padStart(3, " ")}%`,
      "bright",
    ],
  ];
}

const POST: Entry[] = [
  { at: 0, line: [["REVENANTAL BIOS v4.04", "bright"]] },
  { at: 120, line: [["(C) 1989-1993 Revenantal Systems Ltd."]] },
  { at: 240, line: BLANK },
  { at: 360, line: [["Processor        : RV-486DX2 at 66MHz"]] },
  { at: 500, line: memoryLine },
  {
    at: 1900,
    line: [["Extended Memory  : "], ["3072K", "bright"], [" OK", "ok"]],
  },
  { at: 2150, line: BLANK },
  { at: 2200, line: [["Primary Master    ... "], ["RV-40 40MB", "bright"]] },
  { at: 2450, line: [["Primary Slave     ... None"]] },
  { at: 2700, line: [["Floppy Drive A:   ... "], ['1.44MB 3.5"', "bright"]] },
  { at: 2950, line: [["Keyboard          ... "], ["Detected", "ok"]] },
  {
    at: 3200,
    line: [
      ["Mouse             ... "],
      ["Not found", "warn"],
      [" (carrying on regardless)"],
    ],
  },
  { at: 3450, line: BLANK },
  {
    at: 3500,
    line: [["Press DEL to enter SETUP, or ignore this and carry on.", "dim"]],
  },
];

const LOGO = blockWord("REVENANTAL");

const LOAD: Entry[] = [
  ...LOGO.map((row): Entry => ({
    at: LOAD_START_MS,
    line: [[`  ${row}`, "logo"]],
  })),
  { at: LOAD_START_MS, line: BLANK },
  { at: 4000, line: [["  Starting REVENANTAL.SH version 4.04...", "bright"]] },
  { at: BAR_START_MS, line: barLine },
  { at: 4250, line: BLANK },
  { at: 4350, line: [["  Loading HIMEM.SYS ........ "], ["OK", "ok"]] },
  { at: 4650, line: [["  Loading PROJECTS.DRV ..... "], ["OK", "ok"]] },
  { at: 4950, line: [["  Loading SERVERS.DRV ...... "], ["OK", "ok"]] },
  { at: 5250, line: [["  Mounting drive C: ........ "], ["OK", "ok"]] },
  { at: 5550, line: BLANK },
  { at: BAR_END_MS, line: [["  Welcome.", "bright"]] },
];

function visible(entries: Entry[], elapsed: number): BootLine[] {
  return entries
    .filter((entry) => elapsed >= entry.at)
    .map((entry) =>
      typeof entry.line === "function" ? entry.line(elapsed) : entry.line,
    );
}

/**
 * The boot screen at one moment: a power-on self test that clears to a loading screen
 * with a progress bar, then hands over to the terminal.
 *
 * @param elapsed - Milliseconds since the boot started.
 * @returns The phase and the lines on screen.
 */
export function bootFrame(elapsed: number): BootFrame {
  if (elapsed >= BOOT_DURATION_MS)
    return { phase: "done", lines: visible(LOAD, elapsed) };
  if (elapsed < POST_END_MS)
    return { phase: "post", lines: visible(POST, elapsed) };
  return { phase: "load", lines: visible(LOAD, elapsed) };
}
