import type { JSX, TargetedKeyboardEvent } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import { Boot } from "./Boot";
import {
  autocomplete,
  executeCommand,
  type OutputLine,
  type TerminalContext,
} from "./commands";
import styles from "./Terminal.module.css";
import { useKeyClack } from "./use-key-clack";

const MAX_LINES = 200;

function createInitialLines(projects: ChannelProps["projects"]): OutputLine[] {
  return [
    {
      id: "logo-banner",
      kind: "system",
      children: (
        <div className={styles.logo}>
          {"   ▄▄▄▄▄     revenantal.sh\n  █ ▀ ▀ █    "}
          <span className={styles["logo-sub"]}>
            a directory of things I host.
          </span>
          {"\n  █▄▀▄▀▄█    "}
          <span className={styles["logo-sub"]}>type </span>
          <span className={styles.question}>help</span>
          <span className={styles["logo-sub"]}>
            , or click a command below.
          </span>
        </div>
      ),
    },
    {
      id: "initial-prompt",
      kind: "prompt",
      cwd: "~",
      command: "ls ~/projects",
    },
    {
      id: "initial-listing",
      kind: "links",
      data: {
        projects,
        mode: "projects",
      },
    },
  ];
}

/**
 * CH 03 Terminal: a DOS-era boot screen that hands over to a retro command shell.
 *
 * @param props - Channel properties from the TV host.
 * @returns Preact component.
 */
export function ChannelComponent(props: ChannelProps): JSX.Element {
  const [booting, setBooting] = useState(!props.reducedMotion);
  // True when the viewer skipped the boot, so the cursor goes to the input once it ends.
  const [focusInput, setFocusInput] = useState(false);
  const [cwd, setCwd] = useState<string>("~");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [input, setInput] = useState<string>("");
  const [lines, setLines] = useState<OutputLine[]>(() =>
    createInitialLines(props.projects),
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clack = useKeyClack(props.active, props.play);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (!booting && focusInput) inputRef.current?.focus();
  }, [booting, focusInput]);

  const finishBoot = useCallback((focus: boolean) => {
    setFocusInput(focus);
    setBooting(false);
  }, []);

  const copyDiscord = async (): Promise<boolean> => {
    if (!props.links.discord) return false;
    try {
      if (typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(props.links.discord);
        return true;
      }
    } catch {
      // Fallback or ignore
    }
    return false;
  };

  const openUrl = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const context: TerminalContext = {
    cwd,
    setCwd,
    clear: () => {
      setLines([]);
    },
    openUrl,
    copyDiscord,
  };

  const runCommand = (commandStr: string) => {
    const newLines = executeCommand(commandStr, props, context);
    if (newLines.length > 0) {
      setLines((prev) => [...prev, ...newLines].slice(-MAX_LINES));
    }
    const trimmed = commandStr.trim();
    if (trimmed) {
      setHistory((prev) => [...prev, trimmed]);
    }
    setHistoryIndex(-1);
    setInput("");
  };

  const runChip = (commandStr: string) => {
    clack({ key: "Enter", ctrlKey: false, metaKey: false, altKey: false });
    runCommand(commandStr);
  };

  const handleKeyDown = (e: TargetedKeyboardEvent<HTMLInputElement>) => {
    // Keep keys inside terminal input; do not let arrow keys turn the TV dial
    e.stopPropagation();
    clack(e);

    const currentVal = e.currentTarget.value;

    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(currentVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx] ?? "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        if (historyIndex < history.length - 1) {
          const nextIdx = historyIndex + 1;
          setHistoryIndex(nextIdx);
          setInput(history[nextIdx] ?? "");
        } else {
          setHistoryIndex(-1);
          setInput("");
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completed = autocomplete(currentVal, cwd, props.projects);
      setInput(completed);
    } else if (e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const renderLine = (line: OutputLine) => {
    if (line.kind === "prompt") {
      return (
        <div key={line.id} className={styles["prompt-row"]}>
          <span className={styles["prompt-user"]}>guest@revenantal</span>
          <span className={styles["prompt-sep"]}>:</span>
          <span className={styles["prompt-dir"]}>{line.cwd || "~"}</span>
          <span className={styles["prompt-sep"]}>$</span>
          <span className={styles["prompt-cmd"]}>{line.command}</span>
        </div>
      );
    }

    if (line.kind === "links") {
      const projects = line.data?.projects || props.projects;
      const mode = line.data?.mode || "projects";

      if (mode === "root") {
        return (
          <div key={line.id} className={styles["folder-grid"]}>
            <span className={styles.folder}>projects/</span>
            <span className={styles.file}>README.md</span>
            <span className={styles.executable}>servers*</span>
          </div>
        );
      }

      return (
        <div key={line.id} className={styles["folder-grid"]}>
          {projects.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.folder}
            >
              {p.id}/
            </a>
          ))}
          <span className={styles.file}>README.md</span>
        </div>
      );
    }

    if (line.children) {
      return (
        <div key={line.id} className={styles[line.kind]}>
          {line.children}
        </div>
      );
    }

    return (
      <div key={line.id} className={styles[line.kind]}>
        {line.text}
      </div>
    );
  };

  const firstProjId = props.projects[0]?.id;
  // The chip must fit the bar, so a long name is shortened on the button but run in full.
  const firstProjLabel =
    firstProjId && firstProjId.length > 12
      ? `${firstProjId.slice(0, 10)}..`
      : firstProjId;

  return (
    <div className={styles.root} data-active={String(props.active)}>
      {/* The shell is always mounted, so its project links exist; it stays hidden until the boot ends. */}
      <div
        className={styles.screen}
        data-booting={booting ? "" : undefined}
        aria-hidden={booting ? "true" : undefined}
      >
        <div
          ref={scrollRef}
          className={styles.terminal}
          role="log"
          aria-live="polite"
        >
          {lines.map(renderLine)}

          <div className={styles["input-row"]}>
            <span className={styles["prompt-user"]}>guest@revenantal</span>
            <span className={styles["prompt-sep"]}>:</span>
            <span className={styles["prompt-dir"]}>{cwd}</span>
            <span className={styles["prompt-sep"]}>$</span>
            <input
              ref={inputRef}
              type="text"
              className={styles["cmd-input"]}
              value={input}
              onInput={(e) => {
                setInput((e.target as HTMLInputElement).value);
              }}
              onKeyDown={handleKeyDown}
              aria-label="Terminal command"
              spellcheck={false}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        </div>

        <div className={styles["chips-bar"]}>
          <span className={styles["chip-label"]}>try:</span>
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              runChip("help");
            }}
          >
            help
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              runChip("ls");
            }}
          >
            ls
          </button>
          {firstProjId ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                runChip(`open ${firstProjId}`);
              }}
            >
              open {firstProjLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              runChip("servers");
            }}
          >
            servers
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              runChip("git log");
            }}
          >
            git log
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              runChip("discord");
            }}
          >
            discord
          </button>
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              runChip("credits");
            }}
          >
            credits
          </button>
        </div>
      </div>

      {booting ? <Boot active={props.active} onDone={finishBoot} /> : null}
    </div>
  );
}
