import { useRef } from "preact/hooks";
import { CaptureOverlay, useCaptureFocus } from "../../CaptureOverlay";
import type { ChannelProps } from "../../types";

/**
 * The contract's reference game: every project as a link, PRESS START before it takes the
 * keyboard, and its own focused key handler once captured.
 *
 * @param props - Host props.
 * @returns The sample game.
 */
export function ChannelComponent(props: ChannelProps) {
  const { projects, captured, requestCapture, releaseCapture } = props;
  const surface = useRef<HTMLDivElement>(null);
  useCaptureFocus(surface, captured);
  return (
    <section style={{ position: "relative", width: "760px", height: "570px" }}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the game surface handles keys once the host has captured the keyboard */}
      <div
        ref={surface}
        tabIndex={-1}
        role="application"
        aria-label="Sample game"
        onKeyDown={(event) => {
          if (event.key === "Escape") releaseCapture();
        }}
      >
        <h2>Sample game</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                {project.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <CaptureOverlay captured={captured} onStart={requestCapture} />
    </section>
  );
}
