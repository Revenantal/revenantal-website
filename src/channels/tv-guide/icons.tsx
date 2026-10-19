import type { RowIcon } from "./listings";

const stroke = { stroke: "#fff", "stroke-opacity": 0.7 };

/**
 * The small glossy icon in a row's call-sign cell, by row kind.
 *
 * @param props - Which icon.
 * @param props.icon - The row kind.
 * @returns The icon, hidden from screen readers.
 */
export function Icon({ icon }: { icon: RowIcon }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      {icon === "site" ? (
        <>
          <circle cx="8" cy="8" r="6.5" fill="url(#guide-icon)" {...stroke} />
          <path
            d="M1.5 8h13M8 1.5c-3 3-3 10 0 13M8 1.5c3 3 3 10 0 13"
            fill="none"
            {...stroke}
          />
        </>
      ) : icon === "tool" ? (
        <path
          d="M10.5 1.5a3.5 3.5 0 0 0-3.3 4.6L2 11.3 4.7 14l5.2-5.2a3.5 3.5 0 0 0 4.4-4.6l-2 2-2-.6-.6-2z"
          fill="url(#guide-icon)"
          {...stroke}
        />
      ) : icon === "sandbox" ? (
        <>
          <path
            d="M2 5.5 8 2l6 3.5v5L8 14l-6-3.5z"
            fill="url(#guide-icon)"
            {...stroke}
          />
          <path d="M2 5.5 8 9l6-3.5M8 9v5" fill="none" {...stroke} />
        </>
      ) : icon === "server" ? (
        <>
          <rect
            x="2"
            y="2"
            width="12"
            height="4.5"
            rx="1"
            fill="url(#guide-icon)"
            {...stroke}
          />
          <rect
            x="2"
            y="9.5"
            width="12"
            height="4.5"
            rx="1"
            fill="url(#guide-icon)"
            {...stroke}
          />
          <circle cx="11.5" cy="4.2" r="1" fill="#5dff8a" />
          <circle cx="11.5" cy="11.7" r="1" fill="#5dff8a" />
        </>
      ) : icon === "steam" ? (
        <>
          <path
            d="M3 5h10a3 3 0 0 1 2.8 4l-1 3a1.6 1.6 0 0 1-2.8.4L11 11H5l-1 1.4A1.6 1.6 0 0 1 1.2 12l-1-3A3 3 0 0 1 3 5z"
            fill="url(#guide-icon)"
            {...stroke}
          />
          <path d="M4 7.5v2M3 8.5h2" stroke="#fff" />
          <circle cx="11.5" cy="8" r=".9" fill="#fff" />
        </>
      ) : icon === "git" ? (
        <>
          <circle cx="4" cy="3.5" r="2" fill="url(#guide-icon)" stroke="#fff" />
          <circle
            cx="4"
            cy="12.5"
            r="2"
            fill="url(#guide-icon)"
            stroke="#fff"
          />
          <circle cx="12" cy="6" r="2" fill="url(#guide-icon)" stroke="#fff" />
          <path d="M4 5.5v5M12 8c0 3-8 1.5-8 2.5" stroke="#fff" fill="none" />
        </>
      ) : (
        <>
          <rect
            x="1.5"
            y="3"
            width="13"
            height="10"
            rx="1"
            fill="url(#guide-icon)"
            {...stroke}
          />
          <path d="M1.5 5.5h13M1.5 10.5h13" stroke="#fff" stroke-opacity=".6" />
        </>
      )}
    </svg>
  );
}

/**
 * Shared gradient definitions for the icons, rendered once.
 *
 * @returns Hidden SVG definitions.
 */
export function IconDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="guide-icon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#9fc4ff" />
          <stop offset="1" stop-color="#2a5ad8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
