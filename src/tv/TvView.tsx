import { useEffect, useRef, useState } from "preact/hooks";
import type { AppStore, StoreSnapshot } from "@data/store";
import type { DataView } from "@data/freshness";
import type { Picture } from "./room-glow";
import { Cabinet } from "./Cabinet";
import { Dial } from "./controls/Dial";
import { HintNote } from "./controls/HintNote";
import type { HintPhase } from "./controls/HintNote";
import { wrapPosition } from "./controls/dial-math";
import { PanelButtons } from "./controls/PanelButtons";
import { PowerLed } from "./controls/PowerLed";
import { SettingsDoor } from "./controls/SettingsDoor";
import { usePageVisible } from "./controls/page-visible";
import { usePerfMonitor } from "./controls/perf-monitor";
import { BloomFilter } from "./effects/BloomFilter";
import { NO_SIGNAL_PROFILE, resolveEffects } from "./effects/resolve";
import { ScreenEffects } from "./effects/ScreenEffects";
import { TV_REDUCED_MOTION, useMediaQuery } from "./controls/media-query";
import { useTvKeys } from "./controls/tv-keys";
import { VolumeKnob } from "./controls/VolumeKnob";
import {
  SLOT_COUNT,
  channelLabel,
  channelName,
  manifestAt,
  positionOf,
} from "./lineup";
import { Osd } from "./Osd";
import type { OsdState } from "./Osd";
import { NO_SIGNAL, POWERED_OFF, roomGlowOpacity } from "./room-glow";
import { RoomBackdrop } from "./RoomBackdrop";
import { Screen } from "./screen/Screen";
import type { Boot } from "./screen/Screen";
import { Stage } from "./Stage";
import { useTuning } from "./use-tuning";
import styles from "./TvView.module.css";

/** The TV reads the shared snapshot and changes it only through store actions. */
export type TvViewProps = {
  snapshot: Pick<
    StoreSnapshot,
    | "channel"
    | "power"
    | "settings"
    | "door"
    | "site"
    | "hintDismissed"
    | "now"
    | "perf"
  >;
  view: DataView | null;
  actions: Pick<
    AppStore,
    | "setChannel"
    | "setVolume"
    | "setPower"
    | "setDoor"
    | "toggleSetting"
    | "dismissHint"
    | "setCaptions"
    | "setPerf"
  >;
};

const OSD_MS = 1700;
const INERT_SAVE = {
  load: () => null,
  store: () => false,
  reset: () => false,
};
const HINT_DELAY_MS = 1600;
const HINT_FALL_MS = 1400;

/**
 * The TV mode shell: room, cabinet and every control. Channels, effects and audio arrive in
 * later phase 2 tasks; until then the glass shows the empty NO SIGNAL tube.
 *
 * @param props - Shared snapshot and store actions.
 * @param props.snapshot - Channel, power, door, viewer settings, content and clock.
 * @param props.view - Freshness-filtered projects, servers and live data.
 * @param props.actions - Store actions the controls call.
 * @returns The TV in its room.
 */
export function TvView({ snapshot, view, actions }: TvViewProps) {
  const { channel, power, settings, door, site, hintDismissed, now } = snapshot;
  const visible = usePageVisible();
  const reducedMotion = useMediaQuery(TV_REDUCED_MOTION);
  // Reduced motion keeps the TV calm: no static bursts, boot or warm-up animations.
  const { shown, switching, preview } = useTuning(
    channel,
    settings.fx && !reducedMotion,
    power,
    manifestAt,
  );
  const [osd, setOsd] = useState<OsdState>(null);
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Every page load: the note appears after a moment and falls when dismissed.
  const [hint, setHint] = useState<HintPhase>(
    hintDismissed ? "gone" : "waiting",
  );
  useEffect(() => {
    if (hint !== "waiting" || !power) return;
    const timer = window.setTimeout(() => {
      setHint("shown");
    }, HINT_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [hint, power]);
  useEffect(() => {
    if (hint !== "falling") return;
    const timer = window.setTimeout(() => {
      setHint("gone");
    }, HINT_FALL_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [hint]);
  const dismissHint = () => {
    if (hint !== "waiting" && hint !== "shown") return;
    actions.dismissHint();
    setHint(hint === "shown" ? "falling" : "gone");
  };

  const flash = (next: OsdState, message: string) => {
    window.clearTimeout(timerRef.current);
    setOsd(next);
    setAnnouncement(message);
    timerRef.current = window.setTimeout(() => {
      setOsd(null);
    }, OSD_MS);
  };

  const tune = (position: number) => {
    if (!actions.setChannel(position)) return false;
    dismissHint();
    const label = channelLabel(position);
    const name = channelName(position);
    flash({ kind: "channel", label, name }, `${label}, ${name}`);
    return true;
  };

  const tuneTo = (id: string) => {
    const position = positionOf(id);
    return position !== undefined && tune(position);
  };

  const changeVolume = (volume: number) => {
    actions.setVolume(volume);
    flash(
      { kind: "volume", volume },
      volume === 0 ? "Muted" : `Volume ${String(volume)}`,
    );
  };

  const [boot, setBoot] = useState<Boot>({
    kind: reducedMotion ? "none" : "load",
    key: 0,
  });
  const [offKey, setOffKey] = useState(0);
  const [detune, setDetune] = useState(0);

  const changePower = (on: boolean) => {
    actions.setPower(on);
    setDetune(0);
    if (on)
      setBoot((current) => ({
        kind: reducedMotion ? "none" : "warm",
        key: current.key + 1,
      }));
    else setOffKey((count) => count + 1);
    window.clearTimeout(timerRef.current);
    setOsd(null);
    setAnnouncement(on ? "TV on" : "TV off");
  };

  useTvKeys({
    channel: (delta) => {
      if (power) tune(wrapPosition(channel + delta, SLOT_COUNT));
    },
    volume: (delta) => {
      const next = Math.max(0, Math.min(10, settings.volume + delta));
      if (next !== settings.volume) changeVolume(next);
    },
  });

  usePerfMonitor(power && visible, snapshot.perf, actions.setPerf);
  const manifest = manifestAt(shown);
  const effects = resolveEffects({
    viewer: settings,
    profile: manifest ? manifest.display : NO_SIGNAL_PROFILE,
    power,
    perf: snapshot.perf,
    reducedMotion,
  });
  const picture: Picture = !power
    ? POWERED_OFF
    : manifest
      ? { background: manifest.bg, glow: manifest.glow, level: effects.glow }
      : { ...NO_SIGNAL, level: effects.glow };
  const shownOsd: OsdState =
    hint === "shown"
      ? {
          kind: "channel",
          label: channelLabel(channel),
          name: channelName(channel),
          blink: true,
        }
      : osd;
  const glowOpacity = roomGlowOpacity(picture, power, switching);
  return (
    <main className={styles.tv}>
      <h1 className={styles["sr-only"]}>revenantal</h1>
      <BloomFilter />
      <div className={styles.set}>
        <Stage
          backdrop={
            <RoomBackdrop
              color={picture.glow}
              opacity={glowOpacity}
              breathe={effects.flicker}
            />
          }
        >
          <Cabinet
            picture={picture}
            glowOpacity={glowOpacity}
            breathe={effects.flicker}
            controls={
              <>
                <Dial
                  position={channel}
                  slots={SLOT_COUNT}
                  label={`${channelLabel(channel)}, ${channelName(channel)}`}
                  onTune={tune}
                  onDrag={(drag) => {
                    if (!power) return;
                    preview(drag?.position ?? null);
                    setDetune(drag ? Math.min(1, drag.offset * 2) : 0);
                  }}
                />
                <HintNote
                  phase={power ? hint : "gone"}
                  onDismiss={dismissHint}
                />
                <VolumeKnob volume={settings.volume} onChange={changeVolume} />
                <PanelButtons
                  buttons={site?.buttons ?? []}
                  onTune={tuneTo}
                  onAnnounce={setAnnouncement}
                />
                <SettingsDoor
                  open={door}
                  settings={settings}
                  limited={effects.limited}
                  onDoor={actions.setDoor}
                  onToggle={actions.toggleSetting}
                  onCredits={() => {
                    actions.setDoor(false);
                    tuneTo("credits");
                  }}
                />
                <PowerLed power={power} onPower={changePower} />
              </>
            }
          >
            <Screen
              power={power}
              shown={shown}
              switching={switching}
              visible={visible}
              manifest={manifest}
              broadcast={
                manifest?.kind === "broadcast"
                  ? (site?.broadcast[manifest.id] ?? null)
                  : null
              }
              props={{
                projects: view?.projects ?? [],
                servers: view?.servers ?? [],
                live: view?.live ?? null,
                links: site?.links ?? { steam: "", github: "", discord: "" },
                credits: site?.credits ?? [],
                now,
                reducedMotion,
                // Audio arrives in 2.6, capture and saves in 4.3; until then these are inert.
                volume: 0,
                play: () => undefined,
                setLoop: () => undefined,
                captions: settings.captions,
                setCaptions: actions.setCaptions,
                captured: false,
                requestCapture: () => undefined,
                releaseCapture: () => undefined,
                save: INERT_SAVE,
              }}
              onTune={tuneTo}
              boot={boot}
              offKey={reducedMotion ? 0 : offKey}
              detune={detune}
              bloom={effects.bloom}
              onPowerOff={() => {
                changePower(false);
              }}
            />
            <ScreenEffects
              scan={effects.scan}
              flicker={effects.flicker}
              safe={Boolean(manifest?.safe) && !switching}
              power={power}
            />
            {power ? <Osd osd={shownOsd} /> : null}
          </Cabinet>
        </Stage>
      </div>
      <p className={styles["sr-only"]} aria-live="polite">
        {announcement}
      </p>
    </main>
  );
}
