import { useEffect, useRef, useState } from "preact/hooks";
import type { AppStore, StoreSnapshot } from "@data/store";
import { Cabinet } from "./Cabinet";
import { Dial } from "./controls/Dial";
import { wrapPosition } from "./controls/dial-math";
import { useTvKeys } from "./controls/tv-keys";
import { VolumeKnob } from "./controls/VolumeKnob";
import { SLOT_COUNT, channelLabel, channelName } from "./lineup";
import { Osd } from "./Osd";
import type { OsdState } from "./Osd";
import { NO_SIGNAL, roomGlowOpacity } from "./room-glow";
import { RoomBackdrop } from "./RoomBackdrop";
import { Stage } from "./Stage";
import styles from "./TvView.module.css";

/** The TV reads the shared snapshot and changes it only through store actions. */
export type TvViewProps = {
  snapshot: Pick<StoreSnapshot, "channel" | "power" | "settings">;
  actions: Pick<AppStore, "setChannel" | "setVolume">;
};

const OSD_MS = 1700;

/**
 * The TV mode shell: room, cabinet, dial, volume and on-screen display. The panel buttons,
 * door, power, channels, effects and audio arrive in later phase 2 tasks; until then the
 * glass shows the empty NO SIGNAL tube.
 *
 * @param props - Shared snapshot and store actions.
 * @param props.snapshot - Channel, power and viewer settings.
 * @param props.actions - Store actions the controls call.
 * @returns The TV in its room.
 */
export function TvView({ snapshot, actions }: TvViewProps) {
  const { channel, power, settings } = snapshot;
  const [osd, setOsd] = useState<OsdState>(null);
  const [announcement, setAnnouncement] = useState("");
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
    },
    [],
  );

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
    const label = channelLabel(position);
    const name = channelName(position);
    flash({ kind: "channel", label, name }, `${label}, ${name}`);
  };

  const changeVolume = (volume: number) => {
    actions.setVolume(volume);
    flash(
      { kind: "volume", volume },
      volume === 0 ? "Muted" : `Volume ${String(volume)}`,
    );
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

  const glow = settings.glow && power;
  return (
    <main className={styles.tv}>
      <h1 className={styles["sr-only"]}>revenantal</h1>
      <div className={styles.set}>
        <Stage
          backdrop={
            <RoomBackdrop
              color={NO_SIGNAL.glow}
              opacity={roomGlowOpacity(NO_SIGNAL, glow)}
            />
          }
        >
          <Cabinet
            picture={NO_SIGNAL}
            glow={glow}
            controls={
              <>
                <Dial
                  position={channel}
                  slots={SLOT_COUNT}
                  label={`${channelLabel(channel)}, ${channelName(channel)}`}
                  onTune={tune}
                />
                <VolumeKnob volume={settings.volume} onChange={changeVolume} />
              </>
            }
          >
            <Osd osd={osd} />
          </Cabinet>
        </Stage>
      </div>
      <p className={styles["sr-only"]} aria-live="polite">
        {announcement}
      </p>
    </main>
  );
}
