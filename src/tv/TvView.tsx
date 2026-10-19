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
import { useAudioUnlock } from "./controls/audio-unlock";
import { tvAudio } from "./tv-audio";
import { useChannelHash } from "./controls/channel-hash";
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
  /** How the picture comes on when the TV mounts: a quick boot, or the full warm-up. */
  startup?: "load" | "warm";
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
 * @param props.startup - Quick boot on page load, or warm-up when turned on from List mode.
 * @param props.actions - Store actions the controls call.
 * @returns The TV in its room.
 */
export function TvView({
  snapshot,
  view,
  actions,
  startup = "load",
}: TvViewProps) {
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
  // Turning on from List mode puts focus on the dial.
  const [dialFocus, setDialFocus] = useState(startup === "warm" ? 1 : 0);
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

  // One audio engine for the TV's lifetime; sound files download now, play after a gesture.
  const audio = tvAudio();
  useEffect(() => {
    audio.preload();
  }, [audio]);
  const [audioUnlocked, setAudioUnlocked] = useState(audio.unlocked);
  const [unlockAudio] = useState(() => () => {
    void audio.unlock().then(() => {
      setAudioUnlocked(audio.unlocked);
    });
  });
  const [createAudioScope] = useState(
    () => (manifestAudio: Parameters<typeof audio.createScope>[0]) =>
      audio.createScope(manifestAudio),
  );
  useAudioUnlock(unlockAudio);

  const tune = (position: number) => {
    if (!actions.setChannel(position)) return false;
    audio.play("dial");
    const transition = manifestAt(position)?.display?.transition ?? "static";
    if (settings.fx && !reducedMotion && transition === "static")
      audio.play("static");
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
    audio.play("vol");
    flash(
      { kind: "volume", volume },
      volume === 0 ? "Muted" : `Volume ${String(volume)}`,
    );
  };

  const [boot, setBoot] = useState<Boot>({
    kind: reducedMotion ? "none" : startup,
    key: 0,
  });
  const [offKey, setOffKey] = useState(0);
  const [detune, setDetune] = useState(0);

  const changePower = (on: boolean) => {
    actions.setPower(on);
    audio.play("power_btn");
    if (on) audio.play("crt_on");
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
  useChannelHash(channel, SLOT_COUNT, tune);
  // Turned on from List mode: the same sounds as pressing the power LED.
  useEffect(() => {
    if (startup !== "warm") return;
    audio.play("power_btn");
    audio.play("crt_on");
  }, [audio, startup]);
  useEffect(() => {
    audio.setHidden(!visible);
  }, [audio, visible]);
  useEffect(() => {
    audio.setDucked(power && osd !== null);
  }, [audio, power, osd]);
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
  const noSignal = power && !manifest && !switching;
  useEffect(() => {
    audio.setAmbient({
      power,
      snd: settings.snd,
      volume: settings.volume,
      noSignal,
      detune,
    });
  }, [audio, power, settings.snd, settings.volume, noSignal, detune]);
  return (
    <main className={styles.tv}>
      <button
        type="button"
        className={styles.skip}
        onClick={() => {
          changePower(false);
        }}
      >
        Skip to the simple list
      </button>
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
                  focusRequest={dialFocus}
                  onDrag={(drag) => {
                    if (!power) return;
                    if (drag && drag.position !== shown) audio.play("dial");
                    preview(drag?.position ?? null);
                    setDetune(drag ? Math.min(1, drag.offset * 2) : 0);
                  }}
                />
                <HintNote
                  phase={power ? hint : "gone"}
                  onDismiss={() => {
                    audio.play("toggle");
                    dismissHint();
                    // The note falls away; keep focus on the control it points at.
                    setDialFocus((count) => count + 1);
                  }}
                />
                <VolumeKnob volume={settings.volume} onChange={changeVolume} />
                <PanelButtons
                  buttons={site?.buttons ?? []}
                  onTune={tuneTo}
                  onAnnounce={setAnnouncement}
                  onPress={(phase) => {
                    audio.play(phase === "down" ? "btn_down" : "btn_up");
                  }}
                />
                <SettingsDoor
                  open={door}
                  settings={settings}
                  limited={effects.limited}
                  onDoor={(open) => {
                    audio.play(open ? "door_open" : "door_close");
                    actions.setDoor(open);
                  }}
                  onToggle={(name) => {
                    audio.play("toggle");
                    actions.toggleSetting(name);
                  }}
                  onCredits={() => {
                    audio.play("toggle");
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
                // Effective volume before the channel's active state; the frame zeroes it when inactive.
                volume:
                  audioUnlocked && power && settings.snd
                    ? settings.volume / 10
                    : 0,
                // The frame replaces these with the channel's own sound scope.
                play: () => undefined,
                setLoop: () => undefined,
                // Capture and saves arrive in 4.3; until then these are inert.
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
              createAudioScope={createAudioScope}
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
