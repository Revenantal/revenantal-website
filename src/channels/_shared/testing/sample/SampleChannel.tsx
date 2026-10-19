import { useEffect, useState } from "preact/hooks";
import type { ChannelProps } from "../../types";

/**
 * The contract's reference channel: a ticking clock that runs only while active, every
 * project as a new-tab link, and sound only through the host's play callback.
 *
 * @param props - Host props.
 * @returns The sample channel.
 */
export function ChannelComponent(props: ChannelProps) {
  const { active, projects, play, reducedMotion } = props;
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!active || reducedMotion) return;
    const timer = window.setInterval(() => {
      setTicks((count) => count + 1);
    }, 500);
    return () => {
      window.clearInterval(timer);
    };
  }, [active, reducedMotion]);
  return (
    <section style={{ width: "760px", height: "570px" }}>
      <h2>Sample · {ticks}</h2>
      {projects.length === 0 ? <p>No projects yet.</p> : null}
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.name}
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          play("blip");
        }}
      >
        Blip
      </button>
    </section>
  );
}
