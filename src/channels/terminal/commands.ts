import type { ComponentChildren } from "preact";
import type { ChannelProps } from "../_shared/types";
import type { Project } from "../../data/types";

/** One line or entry in the terminal scrollback log. */
export type OutputLine = {
  id: string;
  kind: "system" | "prompt" | "text" | "highlight" | "error" | "links";
  text?: string;
  cwd?: string;
  command?: string;
  children?: ComponentChildren;
  data?: {
    projects?: Project[];
    mode?: "root" | "projects";
  };
};

/** Callbacks and mutable state exposed to terminal commands. */
export type TerminalContext = {
  cwd: string;
  setCwd: (cwd: string) => void;
  clear: () => void;
  openUrl: (url: string) => void;
  copyDiscord: () => Promise<boolean>;
};

/** Built-in commands supported by the terminal. */
export const COMMAND_LIST = [
  "help",
  "ls",
  "cd",
  "cat",
  "open",
  "servers",
  "git log",
  "steam",
  "links",
  "discord",
  "credits",
  "clear",
] as const;

/**
 * Finds a project by slug id or name.
 *
 * @param projects - List of site projects.
 * @param name - Search query slug or title.
 * @returns The matching project or undefined.
 */
export function findProject(
  projects: Project[],
  name: string,
): Project | undefined {
  const query = name.trim().toLowerCase().replace(/\/$/, "");
  return projects.find(
    (p) => p.id.toLowerCase() === query || p.name.toLowerCase() === query,
  );
}

/**
 * Autocompletes commands and arguments for Tab completion.
 *
 * @param input - Current input buffer.
 * @param _cwd - Current directory path (reserved for future path completion).
 * @param projects - Available projects for completion.
 * @returns The completed string or unchanged input.
 */
export function autocomplete(
  input: string,
  _cwd: string,
  projects: Project[],
): string {
  const trimmed = input.trimStart();
  const parts = trimmed.split(/\s+/);

  if (parts.length <= 1) {
    const prefix = parts[0] ?? "";
    const matches = COMMAND_LIST.filter((cmd) => cmd.startsWith(prefix));
    if (matches.length === 1 && matches[0]) {
      return matches[0] + " ";
    }
    return input;
  }

  const [cmd, ...argParts] = parts;
  const currentArg = argParts.join(" ");

  if (cmd === "open" || cmd === "cd" || cmd === "cat") {
    const projectNames = projects.map((p) => p.id);
    const matches = projectNames.filter((name) =>
      name.toLowerCase().startsWith(currentArg.toLowerCase()),
    );
    if (matches.length === 1 && matches[0]) {
      return `${cmd} ${matches[0]}`;
    }
  }

  return input;
}

/**
 * Executes a single command string and produces output lines.
 *
 * @param rawInput - Raw text entered by the user.
 * @param props - Channel properties from the TV host.
 * @param ctx - Terminal execution context.
 * @returns Array of new output lines to append.
 */
export function executeCommand(
  rawInput: string,
  props: ChannelProps,
  ctx: TerminalContext,
): OutputLine[] {
  const trimmed = rawInput.trim();
  const timestamp = String(Date.now());
  const rand = String(Math.random());

  if (!trimmed) {
    return [
      {
        id: `p-${timestamp}-${rand}`,
        kind: "prompt",
        cwd: ctx.cwd,
        command: "",
      },
    ];
  }

  const promptLine: OutputLine = {
    id: `p-${timestamp}-${rand}`,
    kind: "prompt",
    cwd: ctx.cwd,
    command: trimmed,
  };

  const parts = trimmed.split(/\s+/);
  const cmd = (parts[0] ?? "").toLowerCase();
  const args = parts.slice(1);
  const argString = args.join(" ").trim();

  const lines: OutputLine[] = [promptLine];

  const add = (
    kind: OutputLine["kind"],
    text: string,
    children?: ComponentChildren,
    data?: OutputLine["data"],
  ) => {
    lines.push({
      id: `l-${timestamp}-${rand}-${String(lines.length)}`,
      kind,
      text,
      children,
      data,
    });
  };

  switch (cmd) {
    case "help": {
      add("highlight", "Available commands:");
      add("text", "  ls [dir]        List projects, servers, and files");
      add(
        "text",
        "  cd <dir>        Change directory (~, projects, <project>)",
      );
      add("text", "  cat <file>      Display README or project info");
      add("text", "  open <project>  Launch project in a new tab");
      add("text", "  servers         Show live status of game servers");
      add("text", "  git log         Recent commits from GitHub");
      add("text", "  steam           Now playing and library stats");
      add("text", "  links           External links (Steam, GitHub, Discord)");
      add("text", "  discord         Copy Discord username to clipboard");
      add("text", "  credits         Show site credits and attributions");
      add("text", "  clear           Clear the terminal screen");
      break;
    }

    case "ls": {
      const target = argString || ctx.cwd;
      if (target === "~" || target === "/") {
        add("text", "Directory contents of ~:");
        add("links", "", undefined, {
          projects: props.projects,
          mode: "root",
        });
      } else if (
        target === "projects" ||
        target === "~/projects" ||
        target === "/projects"
      ) {
        add(
          "text",
          `Directory contents of ~/projects (${String(props.projects.length)} projects):`,
        );
        add("links", "", undefined, {
          projects: props.projects,
          mode: "projects",
        });
      } else {
        const proj = findProject(
          props.projects,
          target.replace(/^~?\/projects\//, ""),
        );
        if (proj) {
          add("text", `Directory contents of ~/projects/${proj.id}:`);
          add("text", "README.md   launch.sh*");
        } else {
          add(
            "error",
            `ls: cannot access '${target}': No such file or directory`,
          );
        }
      }
      break;
    }

    case "cd": {
      if (!argString || argString === "~" || argString === "/") {
        ctx.setCwd("~");
      } else if (
        argString === "projects" ||
        argString === "~/projects" ||
        argString === "/projects"
      ) {
        ctx.setCwd("~/projects");
      } else if (argString === "..") {
        if (ctx.cwd.startsWith("~/projects/")) {
          ctx.setCwd("~/projects");
        } else if (ctx.cwd === "~/projects") {
          ctx.setCwd("~");
        }
      } else if (argString === "/secret" || argString === "secret") {
        add("error", "bash: cd: /secret: permission denied — nice try.");
      } else if (argString === "/graveyard" || argString === "graveyard") {
        add("error", "bash: cd: /graveyard: permission denied — nice try.");
      } else if (argString === "/root" || argString === "root") {
        add("error", "bash: cd: /root: permission denied.");
      } else {
        const projName = argString.replace(/^~?\/projects\//, "");
        const proj = findProject(props.projects, projName);
        if (proj) {
          ctx.setCwd(`~/projects/${proj.id}`);
        } else {
          add("error", `bash: cd: ${argString}: No such file or directory`);
        }
      }
      break;
    }

    case "cat": {
      const target = argString.toLowerCase();
      if (!target || target === "readme.md" || target === "readme") {
        if (ctx.cwd.startsWith("~/projects/")) {
          const projId = ctx.cwd.replace("~/projects/", "");
          const proj = findProject(props.projects, projId);
          if (proj) {
            add("highlight", `# ${proj.name}`);
            add("text", proj.desc || "(no description)");
            add(
              "text",
              `Host: ${proj.host} · Type: ${proj.type} · Status: ${proj.status ?? "unknown"}`,
            );
            add("system", "→ Run 'open' to launch in a new tab.");
          } else {
            add("error", "cat: README.md: No such file or directory");
          }
        } else {
          add("highlight", "# REVENANTAL");
          add(
            "text",
            "A directory of things I host: sandbox projects, tools, and game servers.",
          );
          add(
            "text",
            "Type 'help' to see commands, or click any chip along the bottom.",
          );
        }
      } else if (target === "launch.sh" && ctx.cwd.startsWith("~/projects/")) {
        const projId = ctx.cwd.replace("~/projects/", "");
        const proj = findProject(props.projects, projId);
        if (proj) {
          add("text", "#!/usr/bin/env sh");
          add("text", `open "${proj.url}"`);
        } else {
          add("error", "cat: launch.sh: No such file or directory");
        }
      } else {
        const proj = findProject(props.projects, target);
        if (proj) {
          add("highlight", `# ${proj.name}`);
          add("text", proj.desc || "(no description)");
          add(
            "text",
            `Host: ${proj.host} · Type: ${proj.type} · Status: ${proj.status ?? "unknown"}`,
          );
          add("system", `→ Run 'open ${proj.id}' to launch in a new tab.`);
        } else {
          add("error", `cat: ${argString}: No such file or directory`);
        }
      }
      break;
    }

    case "open": {
      let targetProj: Project | undefined;
      if (argString) {
        targetProj = findProject(props.projects, argString);
      } else if (ctx.cwd.startsWith("~/projects/")) {
        const projId = ctx.cwd.replace("~/projects/", "");
        targetProj = findProject(props.projects, projId);
      }

      if (targetProj) {
        add(
          "system",
          `Opening ${targetProj.name} (${targetProj.url}) in a new tab...`,
        );
        ctx.openUrl(targetProj.url);
      } else if (argString) {
        add(
          "error",
          `open: project '${argString}' not found. Type 'ls' to see projects.`,
        );
      } else {
        const sample = props.projects[0]?.id || "project-a";
        add("error", `open: specify a project name (e.g. 'open ${sample}')`);
      }
      break;
    }

    case "servers": {
      const serverList = props.servers ?? [];
      if (serverList.length === 0) {
        add("text", "No servers currently registered.");
        break;
      }

      if (!props.live) {
        add(
          "error",
          "[!] Upstream server data unavailable (no signal from upstream).",
        );
      }

      add(
        "highlight",
        `${"NAME".padEnd(16)}${"GAME".padEnd(12)}${"STATE".padEnd(12)}${"PLAYERS".padEnd(10)}ADDRESS`,
      );

      for (const s of serverList) {
        const name = (s.name || "server").slice(0, 15).padEnd(16);
        const game = (s.game || "game").slice(0, 11).padEnd(12);
        const state = s.state.toUpperCase().slice(0, 11).padEnd(12);
        const players = (
          s.players !== undefined
            ? `${String(s.players)}${s.maxPlayers ? `/${String(s.maxPlayers)}` : ""}`
            : "--"
        ).padEnd(10);
        const addr = s.address ? s.address : "--";
        add("text", `${name}${game}${state}${players}${addr}`);
      }

      if (props.freshness.servers.state === "stale") {
        add("system", "(Server observation data is stale)");
      }
      break;
    }

    case "git":
    case "git log": {
      if (args[0] && args[0] !== "log") {
        add(
          "error",
          `git: '${args[0]}' is not a valid git command. Try 'git log'.`,
        );
        break;
      }
      const repos = props.live?.github?.repos;
      if (!repos || repos.length === 0) {
        add(
          "error",
          "[!] GitHub activity feed unavailable (no signal from upstream).",
        );
      } else {
        add("highlight", "Recent GitHub commits:");
        for (const repo of repos.slice(0, 5)) {
          const date = repo.pushedAt ? repo.pushedAt.slice(0, 10) : "";
          add(
            "text",
            `* ${repo.name} [${repo.lang || "code"}] - pushed ${date}`,
          );
        }
      }
      break;
    }

    case "steam":
    case "playing": {
      const steam = props.live?.steam;
      if (!steam) {
        add("error", "[!] Steam community feed unavailable.");
      } else {
        add("highlight", `Steam Status: ${steam.status.toUpperCase()}`);
        add("text", `Library: ${String(steam.gamesOwned)} games owned`);
        if (steam.recent.length > 0) {
          add("highlight", "Recently played:");
          for (const g of steam.recent) {
            add(
              "text",
              `  ${g.name} (${String(g.hours2w)}h past 2 weeks · ${String(g.hoursTotal)}h total)`,
            );
          }
        }
      }
      break;
    }

    case "links": {
      add("highlight", "External Links:");
      add("text", `Steam:   ${props.links.steam}`);
      add("text", `GitHub:  ${props.links.github}`);
      add("text", `Discord: ${props.links.discord}`);
      break;
    }

    case "discord": {
      add("text", `Discord: ${props.links.discord}`);
      void ctx.copyDiscord().catch(() => false);
      add("highlight", `Copied "${props.links.discord}" to clipboard.`);
      break;
    }

    case "credits": {
      add("highlight", "=== REVENANTAL CREDITS ===");
      const byDept: Record<string, typeof props.credits> = {};
      for (const c of props.credits) {
        const dept = c.department || "General";
        if (!byDept[dept]) byDept[dept] = [];
        byDept[dept].push(c);
      }
      for (const [dept, list] of Object.entries(byDept)) {
        add("highlight", `[ ${dept} ]`);
        for (const c of list) {
          add("text", `  ${c.title} — ${c.author} (${c.license})`);
        }
      }
      break;
    }

    case "clear": {
      ctx.clear();
      return [];
    }

    case "sudo": {
      add(
        "error",
        "guest is not in the sudoers file. This incident will be reported.",
      );
      break;
    }

    case "rm": {
      add("error", "nice try, filesystem is mounted read-only.");
      break;
    }

    case "whoami": {
      add("text", "guest (visitor on revenantal.com)");
      break;
    }

    case "uname": {
      add(
        "text",
        "Linux revenantal 6.8.0-solid-state #404-RV PREEMPT Wed Oct 28 2026 x86_64 GNU/Linux",
      );
      break;
    }

    case "date": {
      add("text", props.now.toUTCString());
      break;
    }

    case "echo": {
      add("text", argString);
      break;
    }

    case "exit":
    case "poweroff":
    case "shutdown": {
      add("system", "System going down for power off NOW!");
      props.host.powerOff();
      break;
    }

    default: {
      add(
        "error",
        `bash: ${cmd}: command not found. Type 'help' for available commands.`,
      );
      break;
    }
  }

  return lines;
}
