import { useEffect, useRef } from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import styles from "./Xbox.module.css";

const STILL = "/assets/xbox/menu.webp";

/**
 * CH 07 XBOX: the original Halo main menu, as if the TV's input were an Xbox left on the
 * menu. A muted video loop plays only while the channel is active; reduced motion shows
 * its first frame. The music is the manifest's loop, played by the host. Microsoft's
 * notice lives with the Halo credits (Credits channel, List mode and CREDITS.md).
 *
 * @param props - Channel props; only activity and motion are read.
 * @param props.active - Whether the channel is tuned in and visible.
 * @param props.reducedMotion - Show the still instead of the loop.
 * @returns The channel.
 */
export function ChannelComponent({ active, reducedMotion }: ChannelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const moving = active && !reducedMotion;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!moving) {
      video.pause();
      return;
    }
    video.muted = true;
    // Browsers may refuse playback; the poster frame then stays on screen.
    Promise.resolve(video.play()).catch(() => undefined);
    return () => {
      video.pause();
    };
  }, [moving]);

  return (
    <div className={styles.root}>
      <p className={styles["sr-only"]}>
        Xbox: the Halo main menu with its theme.
      </p>
      {reducedMotion ? (
        <img className={styles.menu} src={STILL} alt="" />
      ) : (
        <video
          ref={videoRef}
          className={styles.menu}
          poster={STILL}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/xbox/menu.webm" type="video/webm" />
          <source src="/assets/xbox/menu.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
