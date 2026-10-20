import { useEffect, useRef } from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import styles from "./Xbox.module.css";

const STILL = "/assets/xbox/menu.webp";
const RULES = "https://www.xbox.com/en-US/developers/rules";

/**
 * CH 07 XBOX: the original Halo main menu, as if the TV's input were an Xbox left on the
 * menu. A muted video loop plays only while the channel is active; reduced motion shows
 * its first frame. The music is the manifest's loop, played by the host.
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
      <p className={styles.notice}>
        Halo © Microsoft Corporation. revenantal was created under Microsoft's
        &ldquo;
        <a href={RULES} target="_blank" rel="noopener noreferrer">
          Game Content Usage Rules
          <span className={styles["sr-only"]}> (opens in a new tab)</span>
        </a>
        &rdquo; using assets from Halo, and it is not endorsed by or affiliated
        with Microsoft.
      </p>
    </div>
  );
}
