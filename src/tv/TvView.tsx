import { useEffect, useRef, useState } from "preact/hooks";
import type { AppStore, StoreSnapshot } from "@data/store";
import { Cabinet } from "./Cabinet";
import { Dial } from "./controls/Dial";
import { HintNote } from "./controls/HintNote";
import type { HintPhase } from "./controls/HintNote";
import { wrapPosition } from "./controls/dial-math";
import { PanelButtons } from "./controls/PanelButtons";
import { PowerLed } from "./controls/PowerLed";
import { SettingsDoor } from "./controls/SettingsDoor";
import { useTvKeys } from "./controls/tv-keys";
import { VolumeKnob } from "./controls/VolumeKnob";
import { SLOT_COUNT, channelLabel, channelName, positionOf } from "./lineup";
import { Osd } from "./Osd";
import type { OsdState } from "./Osd";
import { NO_SIGNAL, POWERED_OFF, roomGlowOpacity } from "./room-glow";
import { RoomBackdrop } from "./RoomBackdrop";
import { Stage } from "./Stage";
import styles from "./TvView.module.css";

/** The TV reads the shared snapshot and changes it only through store actions. */
export type TvViewProps = {
  snapshot: Pick<
    StoreSnapshot,
    "channel" | "power" | "settings" | "door" | "site" | "hintDismissed"
  >;
  actions: Pick<
    AppStore,
    | "setChannel"
    | "setVolume"
    | "setPower"
    | "setDoor"
    | "toggleSetting"
    | "dismissHint"
  >;
};

const OSD_MS = 1700;
const HINT_DELAY_MS = 1600;
const HINT_FALL_MS = 1400;

/**
 * The TV mode shell: room, cabinet and every control. Channels, effects and audio arrive in
 * later phase 2 tasks; until then the glass shows the empty NO SIGNAL tube.
 *
 * @param props - Shared snapshot and store actions.
 * @param props.snapshot - Channel, power, door, viewer settings and content.
 * @param props.actions - Store actions the controls call.
 * @returns The TV in its room.
 */
export function TvView({ snapshot, actions }: TvViewProps) {
  const { channel, power, settings, door, site, hintDismissed } = snapshot;
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
    if (!actions.setChannel(position)) return;
    dismissHint();
    const label = channelLabel(position);
    const name = channelName(position);
    flash({ kind: "channel", label, name }, `${label}, ${name}`);
  };

  const tuneTo = (id: string) => {
    const position = positionOf(id);
    if (position !== undefined) tune(position);
  };

  const changeVolume = (volume: number) => {
    actions.setVolume(volume);
    flash(
      { kind: "volume", volume },
      volume === 0 ? "Muted" : `Volume ${String(volume)}`,
    );
  };

  const changePower = (on: boolean) => {
    actions.setPower(on);
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

  const picture = power ? NO_SIGNAL : POWERED_OFF;
  const shownOsd: OsdState =
    hint === "shown"
      ? {
          kind: "channel",
          label: channelLabel(channel),
          name: channelName(channel),
          blink: true,
        }
      : osd;
  const glowOpacity = roomGlowOpacity(picture, settings.glow && power);
  return (
    <main className={styles.tv}>
      <h1 className={styles["sr-only"]}>revenantal</h1>
      <div className={styles.set}>
        <Stage
          backdrop={<RoomBackdrop color={picture.glow} opacity={glowOpacity} />}
        >
          <Cabinet
            picture={picture}
            glow={settings.glow && power}
            controls={
              <>
                <Dial
                  position={channel}
                  slots={SLOT_COUNT}
                  label={`${channelLabel(channel)}, ${channelName(channel)}`}
                  onTune={tune}
                />
                <HintNote phase={hint} onDismiss={dismissHint} />
                <VolumeKnob volume={settings.volume} onChange={changeVolume} />
                <PanelButtons
                  buttons={site?.buttons ?? []}
                  onTune={tuneTo}
                  onAnnounce={setAnnouncement}
                />
                <SettingsDoor
                  open={door}
                  settings={settings}
                  limited={{
                    glow:
                      settings.glow &&
                      power &&
                      picture.level !== false &&
                      picture.level < 1,
                  }}
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
