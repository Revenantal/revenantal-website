import { describe, expect, it, vi } from "vitest";
import { channelProps } from "../_shared/testing/fixtures";
import {
  autocomplete,
  executeCommand,
  findProject,
  type TerminalContext,
} from "./commands";

function createMockContext(
  overrides: Partial<TerminalContext> = {},
): TerminalContext {
  return {
    cwd: "~",
    setCwd: vi.fn(),
    clear: vi.fn(),
    openUrl: vi.fn(),
    copyDiscord: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("terminal commands", () => {
  const props = channelProps();

  it("finds projects by id or name regardless of case and slash", () => {
    const p = props.projects[0];
    if (!p) throw new Error("Need at least one project");
    expect(findProject(props.projects, p.id)?.id).toBe(p.id);
    expect(findProject(props.projects, p.id.toUpperCase())?.id).toBe(p.id);
    expect(findProject(props.projects, `${p.id}/`)?.id).toBe(p.id);
    expect(findProject(props.projects, "non-existent")).toBeUndefined();
  });

  it("autocompletes commands and project arguments", () => {
    expect(autocomplete("se", "~", props.projects)).toBe("servers ");
    expect(autocomplete("he", "~", props.projects)).toBe("help ");
    const p = props.projects[0];
    if (p) {
      const prefix = p.id.slice(0, 3);
      expect(autocomplete(`open ${prefix}`, "~", props.projects)).toBe(
        `open ${p.id}`,
      );
      expect(autocomplete(`cd ${prefix}`, "~", props.projects)).toBe(
        `cd ${p.id}`,
      );
    }
  });

  it("executes help command", () => {
    const ctx = createMockContext();
    const lines = executeCommand("help", props, ctx);
    expect(lines.some((l) => l.text?.includes("Available commands"))).toBe(
      true,
    );
    expect(lines.some((l) => l.text?.includes("ls"))).toBe(true);
    expect(lines.some((l) => l.text?.includes("open"))).toBe(true);
  });

  it("executes ls command at root and projects directory", () => {
    const ctx = createMockContext({ cwd: "~" });
    const rootLines = executeCommand("ls", props, ctx);
    expect(rootLines.length).toBeGreaterThan(1);

    const projLines = executeCommand("ls projects", props, ctx);
    expect(
      projLines.some((l) =>
        l.text?.includes("Directory contents of ~/projects"),
      ),
    ).toBe(true);
  });

  it("executes cd navigation and jokes", () => {
    const setCwd = vi.fn();
    const ctx = createMockContext({ setCwd });

    executeCommand("cd projects", props, ctx);
    expect(setCwd).toHaveBeenCalledWith("~/projects");

    executeCommand("cd ~", props, ctx);
    expect(setCwd).toHaveBeenCalledWith("~");

    const jokeLines = executeCommand("cd /secret", props, ctx);
    expect(
      jokeLines.some((l) => l.text?.includes("permission denied — nice try")),
    ).toBe(true);
  });

  it("executes cat on README and projects", () => {
    const ctx = createMockContext();
    const readmeLines = executeCommand("cat README.md", props, ctx);
    expect(readmeLines.some((l) => l.text?.includes("REVENANTAL"))).toBe(true);

    const p = props.projects[0];
    if (p) {
      const projLines = executeCommand(`cat ${p.id}`, props, ctx);
      expect(projLines.some((l) => l.text?.includes(p.name))).toBe(true);
    }
  });

  it("executes open to launch projects", () => {
    const openUrl = vi.fn();
    const ctx = createMockContext({ openUrl });
    const p = props.projects[0];
    if (p) {
      const lines = executeCommand(`open ${p.id}`, props, ctx);
      expect(openUrl).toHaveBeenCalledWith(p.url);
      expect(lines.some((l) => l.text?.includes("Opening"))).toBe(true);
    }
  });

  it("executes servers table and respects address publishing", () => {
    const ctx = createMockContext();
    const serversWithSecret = [
      {
        id: "srv-1",
        name: "Test Server",
        game: "minecraft",
        state: "running" as const,
        players: 4,
        maxPlayers: 20,
        address: "play.example.com:25565",
      },
      {
        id: "srv-2",
        name: "Private Server",
        game: "factorio",
        state: "running" as const,
        address: undefined, // unpublished
      },
    ];

    const lines = executeCommand(
      "servers",
      { ...props, servers: serversWithSecret },
      ctx,
    );
    expect(lines.some((l) => l.text?.includes("Test Server"))).toBe(true);
    expect(lines.some((l) => l.text?.includes("play.example.com:25565"))).toBe(
      true,
    );
    expect(lines.some((l) => l.text?.includes("Private Server"))).toBe(true);
  });

  it("handles live = null gracefully", () => {
    const ctx = createMockContext();
    const nullLiveProps = { ...props, live: null, servers: [] };
    const gitLines = executeCommand("git log", nullLiveProps, ctx);
    expect(gitLines.some((l) => l.text?.includes("unavailable"))).toBe(true);

    const steamLines = executeCommand("steam", nullLiveProps, ctx);
    expect(steamLines.some((l) => l.text?.includes("unavailable"))).toBe(true);

    const serverLines = executeCommand("servers", nullLiveProps, ctx);
    expect(serverLines.some((l) => l.text?.includes("No servers"))).toBe(true);
  });

  it("executes discord copy", () => {
    const copyDiscord = vi.fn().mockResolvedValue(true);
    const ctx = createMockContext({ copyDiscord });
    const lines = executeCommand("discord", props, ctx);
    expect(copyDiscord).toHaveBeenCalled();
    expect(lines.some((l) => l.text?.includes("Copied"))).toBe(true);
  });

  it("executes clear", () => {
    const clear = vi.fn();
    const ctx = createMockContext({ clear });
    const lines = executeCommand("clear", props, ctx);
    expect(clear).toHaveBeenCalled();
    expect(lines).toEqual([]);
  });

  it("handles sudo and rm jokes", () => {
    const ctx = createMockContext();
    const sudoLines = executeCommand("sudo rm -rf /", props, ctx);
    expect(sudoLines.some((l) => l.text?.includes("sudoers"))).toBe(true);

    const rmLines = executeCommand("rm -rf /", props, ctx);
    expect(rmLines.some((l) => l.text?.includes("read-only"))).toBe(true);
  });

  it("handles unknown commands", () => {
    const ctx = createMockContext();
    const lines = executeCommand("unknowncmd123", props, ctx);
    expect(lines.some((l) => l.text?.includes("command not found"))).toBe(true);
  });
});
