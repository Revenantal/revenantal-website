import { z } from "zod";
import { filterFreshData } from "./freshness";
import { loadLive, loadSite } from "./loaders";
import { CHANNEL_KEY, POWER_KEY, remember } from "./persistence";
import type { Live, Site } from "./types";

const settingsSchema = z.object({
  scan: z.boolean().default(true),
  flicker: z.boolean().default(true),
  fx: z.boolean().default(true),
  snd: z.boolean().default(true),
  glow: z.boolean().default(true),
  volume: z.number().int().min(0).max(10).default(5),
  captions: z.boolean().default(true),
});
type Settings = z.infer<typeof settingsSchema>;
type Setting = "scan" | "flicker" | "fx" | "snd" | "glow";

/** The shared content, observations and UI state exposed through one store. */
export type StoreSnapshot = {
  site: Site | null;
  raw: Live | null;
  now: Date;
  loading: boolean;
  error: boolean;
  power: boolean;
  channel: number;
  door: boolean;
  hintDismissed: boolean;
  perf: number;
  settings: Settings;
};

/** Injectable boundaries keep storage and network failures testable. */
export type StoreOptions = {
  storage?: Pick<Storage, "getItem" | "setItem">;
  fetcher?: typeof fetch;
  now?: Date;
  positionCount?: number;
  /** Starting channel, from the URL or the last visit (see persistence.ts). */
  initialChannel?: number;
  /** Whether the TV starts on; off starts in List mode. */
  initialPower?: boolean;
};

/**
 * Creates the single external store; channels receive derived props rather than importing it.
 *
 * @param options - Optional storage, transport and initial clock for the application host.
 * @returns Subscription access, filtered selectors and the shared mutation actions.
 */
export function createStore(options: StoreOptions = {}) {
  let settings = settingsSchema.parse({});
  try {
    const saved = options.storage?.getItem("rv-settings");
    const parsed = settingsSchema.safeParse(
      saved ? (JSON.parse(saved) as unknown) : {},
    );
    if (parsed.success) settings = parsed.data;
  } catch {
    /* Blocked/malformed storage leaves valid in-memory defaults. */
  }

  let snapshot: StoreSnapshot = {
    site: null,
    raw: null,
    now: options.now ?? new Date(),
    loading: true,
    error: false,
    power: options.initialPower ?? true,
    channel: options.initialChannel ?? 1,
    door: false,
    hintDismissed: false,
    perf: 0,
    settings,
  };
  const listeners = new Set<() => void>();
  const update = (change: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...change };
    for (const listener of listeners) listener();
  };
  const saveSettings = (change: Partial<Settings>) => {
    const next = { ...snapshot.settings, ...change };
    update({ settings: next });
    try {
      options.storage?.setItem("rv-settings", JSON.stringify(next));
    } catch {
      /* Viewer controls continue working when storage is blocked. */
    }
  };
  let loaded: Promise<void> | undefined;
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getView: () =>
      snapshot.site
        ? filterFreshData(snapshot.site, snapshot.raw, snapshot.now)
        : null,
    load: () => {
      loaded ??= Promise.all([
        loadSite(options.fetcher)
          .then((site) => {
            update({ site, loading: false, error: false });
          })
          .catch(() => {
            update({ loading: false, error: true });
          }),
        loadLive(options.fetcher).then((raw) => {
          update({ raw });
        }),
      ]).then(() => undefined);
      return loaded;
    },
    tick: (now: Date) => {
      if (Number.isFinite(now.getTime())) update({ now });
    },
    setPower: (power: boolean) => {
      update({ power, door: power ? snapshot.door : false });
      remember(options.storage, POWER_KEY, power ? "on" : "off");
    },
    setChannel: (position: number) => {
      const count = options.positionCount ?? 1;
      if (
        !snapshot.power ||
        !Number.isSafeInteger(position) ||
        position < 1 ||
        position > count
      )
        return false;
      update({ channel: position });
      remember(options.storage, CHANNEL_KEY, String(position - 1));
      return true;
    },
    setVolume: (volume: number) => {
      if (Number.isFinite(volume))
        saveSettings({ volume: Math.max(0, Math.min(10, Math.round(volume))) });
    },
    toggleSetting: (name: Setting) => {
      saveSettings({ [name]: !snapshot.settings[name] });
    },
    setCaptions: (captions: boolean) => {
      saveSettings({ captions });
    },
    setDoor: (door: boolean) => {
      update({ door: snapshot.power && door });
    },
    dismissHint: () => {
      // Dismissal lasts for this page load only; the note returns on the next load.
      if (!snapshot.hintDismissed) update({ hintDismissed: true });
    },
    setPerf: (perf: number) => {
      if (Number.isInteger(perf) && perf >= 0 && perf <= 2) update({ perf });
    },
  };
}

/** Store surface consumed by the application host and List mode. */
export type AppStore = ReturnType<typeof createStore>;
