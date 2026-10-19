import { useLayoutEffect, useRef } from "preact/hooks";
import { CHANNEL } from "../geometry";
import styles from "./Screen.module.css";

/** Animated analogue snow in channel space. */
export type SnowProps = {
  /** Milliseconds between frames. */
  interval: number;
  /** Animate only while the glass is visible and the tab is shown. */
  running: boolean;
  opacity?: number;
};

// Half-resolution noise, scaled up by the browser; a few frames cycled look random enough.
const WIDTH = CHANNEL.width / 2;
const HEIGHT = CHANNEL.height / 2;
const FRAMES = 6;
let frames: ImageData[] | null = null;

function noiseFrames(context: CanvasRenderingContext2D): ImageData[] {
  if (frames) return frames;
  frames = Array.from({ length: FRAMES }, () => {
    const image = context.createImageData(WIDTH, HEIGHT);
    const data = image.data;
    for (let index = 0; index < data.length; index += 4) {
      const value = Math.floor(Math.random() * 256);
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
    return image;
  });
  return frames;
}

/**
 * Greyscale noise drawn on a canvas from a few pre-made frames. Canvas updates always repaint
 * (an SVG turbulence filter did not, in Chrome). Stops when not running so hidden tabs and
 * the off TV do no work.
 *
 * @param props - Frame interval, running state and opacity.
 * @param props.interval - Milliseconds between frames.
 * @param props.running - Whether to animate.
 * @param props.opacity - Layer opacity, default 1.
 * @returns The snow layer.
 */
export function Snow({ interval, running, opacity = 1 }: SnowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Draw the first frame before paint so a new snow layer never shows one blank frame.
  useLayoutEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const all = noiseFrames(context);
    let frame = 0;
    const draw = () => {
      const image = all[frame % all.length];
      if (image) context.putImageData(image, 0, 0);
      frame += 1 + Math.floor(Math.random() * (all.length - 1));
    };
    draw();
    if (!running) return;
    const timer = window.setInterval(draw, interval);
    return () => {
      window.clearInterval(timer);
    };
  }, [interval, running]);
  return (
    <canvas
      ref={canvasRef}
      className={styles.snow}
      width={WIDTH}
      height={HEIGHT}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
