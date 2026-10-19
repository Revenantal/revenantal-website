import { useEffect, useRef } from "preact/hooks";
import styles from "./TvGuide.module.css";

const WIDTH = 160;
const HEIGHT = 88;
const FRAMES = 4;
const FRAME_MS = 90;

/**
 * Soft, dim static drawn from a few pre-made low-resolution noise frames. It changes frames
 * only while running (active, full motion) and holds one frame otherwise.
 *
 * @param props - Whether to animate.
 * @param props.running - True while the channel is active and motion is allowed.
 * @returns The static canvas.
 */
function Static({ running }: { running: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const frames = Array.from({ length: FRAMES }, () => {
      const image = context.createImageData(WIDTH, HEIGHT);
      for (let index = 0; index < image.data.length; index += 4) {
        const value = 40 + Math.floor(Math.random() * 120);
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value + 12;
        image.data[index + 3] = 255;
      }
      return image;
    });
    let frame = 0;
    const draw = () => {
      const image = frames[frame % FRAMES];
      if (image) context.putImageData(image, 0, 0);
      frame += 1;
    };
    draw();
    if (!running) return;
    const timer = window.setInterval(draw, FRAME_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [running]);
  return (
    <canvas
      ref={canvasRef}
      className={styles.static}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
    />
  );
}

/**
 * The large window: the visitor's local forecast (task 3.5). Until then, and whenever weather
 * is unavailable (Do Not Track, Save-Data, no city or a failure), it shows soft static. It
 * never falls back to a fixed city.
 *
 * @param props - Motion state.
 * @param props.running - True while the channel is active and motion is allowed.
 * @returns The forecast window.
 */
export function ForecastWindow({ running }: { running: boolean }) {
  return (
    <>
      <Static running={running} />
      <span
        className={`${styles.gold ?? ""} ${styles.heavy ?? ""} ${styles.badge ?? ""}`}
      >
        LOCAL FORECAST
      </span>
      <p className={`${styles.shadow ?? ""} ${styles.unavailable ?? ""}`}>
        Forecast not available
      </p>
    </>
  );
}
