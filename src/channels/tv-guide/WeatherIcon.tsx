import type { Condition } from "./weather";

/**
 * A glossy weather icon in the style of 90s broadcast graphics.
 *
 * @param props - What to draw.
 * @param props.icon - The condition's icon kind.
 * @param props.night - Draw a moon instead of a sun.
 * @param props.size - Width in pixels.
 * @returns The icon, hidden from screen readers.
 */
export function WeatherIcon({
  icon,
  night = false,
  size = 78,
}: {
  icon: Condition["icon"];
  night?: boolean;
  size?: number;
}) {
  const sky =
    icon === "clear" || icon === "partly" ? (
      night ? (
        <path
          d="M30 6a14 14 0 1 0 12 22A12 12 0 0 1 30 6z"
          fill="url(#guide-moon)"
        />
      ) : (
        <>
          <circle cx="24" cy="20" r="22" fill="url(#guide-glow)" />
          <circle cx="24" cy="20" r="12" fill="url(#guide-sun)" />
        </>
      )
    ) : null;
  const cloud =
    icon === "clear" ? null : (
      <path
        d="M20 50a10 10 0 0 1 1-20a14 14 0 0 1 27 3a9 9 0 0 1-1 17z"
        fill={
          icon === "storm" || icon === "rain"
            ? "url(#guide-dark-cloud)"
            : "url(#guide-cloud)"
        }
        stroke="#8a9cc0"
        stroke-width="1"
      />
    );
  const extra =
    icon === "rain" ? (
      <path
        d="M26 52l-3 6M34 52l-3 6M42 52l-3 6"
        stroke="#7fc4ff"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    ) : icon === "snow" ? (
      <path
        d="M26 54h.1M34 56h.1M42 54h.1"
        stroke="#fff"
        stroke-width="4"
        stroke-linecap="round"
      />
    ) : icon === "storm" ? (
      <path
        d="M34 48l-5 8h6l-4 8"
        stroke="#ffd400"
        stroke-width="2.5"
        fill="none"
        stroke-linejoin="round"
      />
    ) : icon === "fog" ? (
      <path
        d="M14 54h36M18 60h28"
        stroke="#dfe8ff"
        stroke-width="3"
        stroke-linecap="round"
      />
    ) : null;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size * 0.875}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="guide-sun" cx="40%" cy="35%" r="65%">
          <stop offset="0" stop-color="#fff7b0" />
          <stop offset=".6" stop-color="#ffc21a" />
          <stop offset="1" stop-color="#e07a00" />
        </radialGradient>
        <radialGradient id="guide-glow">
          <stop offset="0" stop-color="#ffd400" stop-opacity=".55" />
          <stop offset="1" stop-color="#ffd400" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="guide-moon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fffbe0" />
          <stop offset="1" stop-color="#c9c08a" />
        </linearGradient>
        <linearGradient id="guide-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#b8c6e0" />
        </linearGradient>
        <linearGradient id="guide-dark-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#c9d2e4" />
          <stop offset="1" stop-color="#7a88a6" />
        </linearGradient>
      </defs>
      {sky}
      {cloud}
      {extra}
    </svg>
  );
}
