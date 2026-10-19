import "@fontsource/archivo-black/latin-400.css";
import { useMemo, useRef, useState } from "preact/hooks";
import type { ChannelProps } from "../_shared/types";
import { placeTrack, useAutoScroll } from "./auto-scroll";
import { Icon, IconDefs } from "./icons";
import { buildRows } from "./listings";
import type { Row } from "./listings";
import { DIAL } from "./dial";
import { ForecastWindow } from "./ForecastWindow";
import { tickerItems } from "./ticker";
import { clockParts, listingSlots, longDate } from "./time";
import styles from "./TvGuide.module.css";

const ROW_HEIGHT = 43; // 40 px row + 3 px gap
const WINDOW_HEIGHT = 232;

/**
 * One listings row: a new-tab link for a project, a tune button for another channel, or a
 * plain box for information only.
 *
 * @param props - The row and how it is drawn.
 * @param props.row - The row.
 * @param props.copy - True for the second, decorative copy used for seamless scrolling.
 * @param props.onTune - Tunes the TV to a channel.
 * @returns The row.
 */
function ListingRow({
  row,
  copy,
  onTune,
}: {
  row: Row;
  copy: boolean;
  onTune: (channelId: string) => void;
}) {
  // Screen readers get one spoken summary; the drawn cells are hidden from them.
  const content = (
    <>
      <span className={styles["sr-only"]}>{row.label}</span>
      <span className={styles.callsign} aria-hidden="true">
        <Icon icon={row.icon} />
        <span className={styles["callsign-text"]}>
          <span
            className={`${styles.heavy ?? ""} ${styles["callsign-name"] ?? ""}`}
          >
            {row.callsign}
          </span>
          <span className={styles["callsign-sub"]}>{row.sub}</span>
        </span>
      </span>
      {row.blocks.map((block, index) => (
        <span
          key={index}
          className={styles.block}
          data-span={block.span}
          aria-hidden="true"
        >
          <span className={styles["block-title"]}>
            {block.title}
            {block.tag ? <span className={styles.tag}>{block.tag}</span> : null}
          </span>
          <span className={styles["block-detail"]}>{block.detail}</span>
        </span>
      ))}
    </>
  );
  const focus = copy ? { tabIndex: -1 } : {};
  const { action } = row;
  return (
    <li className={styles.row}>
      {action.kind === "link" ? (
        <a
          className={styles.cell}
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          {...focus}
        >
          {content}
        </a>
      ) : action.kind === "tune" ? (
        <button
          type="button"
          className={styles.cell}
          onClick={() => {
            onTune(action.channelId);
          }}
          {...focus}
        >
          {content}
        </button>
      ) : (
        <div className={styles.cell}>{content}</div>
      )}
    </li>
  );
}

/**
 * CH 01 TV Guide: a 90s cable guide channel. The large window shows the local forecast
 * (task 3.5; soft static until then or when unavailable), the station box shows the viewer's
 * own clock and the other channels, the listings drift upward, and a LIVE ticker crawls along
 * the bottom. Everything pauses while inactive.
 *
 * @param props - Host props.
 * @returns The guide.
 */
export function ChannelComponent(props: ChannelProps) {
  const { projects, live, freshness, now, active, reducedMotion, host } = props;
  const servers = useMemo(() => props.servers ?? [], [props.servers]);
  const rows = useMemo(
    () =>
      buildRows({
        projects,
        servers,
        live,
        steam: freshness.steam,
        dial: DIAL,
        now,
      }),
    [projects, servers, live, freshness.steam, now],
  );
  const ticker = tickerItems({ projects, live, freshness, now });
  const clock = clockParts(now);
  const { date, slots } = listingSlots(now);

  // Listings drift while active, unless reduced motion asks for a still list or the viewer is
  // hovering or has focus inside. Two copies make the loop seamless when rows overflow.
  const [held, setHeld] = useState({ hover: false, focus: false });
  const scrolls = !reducedMotion && rows.length * ROW_HEIGHT > WINDOW_HEIGHT;
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useAutoScroll(
    trackRef,
    scrolls ? rows.length * ROW_HEIGHT : 0,
    active && scrolls && !held.hover && !held.focus,
  );

  const tune = (channelId: string) => {
    host.tune(channelId);
  };

  // A focused row stays in view: move the drift so the row sits inside the window.
  const reveal = (target: EventTarget | null) => {
    if (!scrolls || !(target instanceof HTMLElement)) return;
    const row = target.closest("li");
    const track = trackRef.current;
    if (!row || !track) return;
    const top = row.offsetTop;
    if (top < offsetRef.current) offsetRef.current = top;
    else if (top + ROW_HEIGHT > offsetRef.current + WINDOW_HEIGHT)
      offsetRef.current = top + ROW_HEIGHT - WINDOW_HEIGHT;
    placeTrack(track, offsetRef.current);
  };

  const crawl = [...ticker, ...ticker].join("   ●   ");
  return (
    <div
      className={styles.root}
      data-active={active}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <IconDefs />
      <h2 className={styles["sr-only"]}>TV Guide</h2>

      {/* Full bleed: the background and ticker bar reach the glass edges; the panels sit in a
          padded box so the curved glass never cuts them off. */}
      <div className={styles.content}>
        <section
          className={`${styles.glass ?? ""} ${styles.forecast ?? ""}`}
          aria-label="Local forecast"
        >
          <ForecastWindow active={active} reducedMotion={reducedMotion} />
        </section>

        <section
          className={`${styles.glass ?? ""} ${styles.station ?? ""}`}
          aria-label="Station"
        >
          <div className={styles.logo} aria-hidden="true">
            <div
              className={`${styles.heavy ?? ""} ${styles["logo-name"] ?? ""}`}
            >
              REVENANTAL
            </div>
            <div className={styles["logo-guide"]}>GUIDE</div>
            <span className={styles.shine} />
          </div>
          <p className={`${styles.shadow ?? ""} ${styles.clock ?? ""}`}>
            <span
              className={`${styles.heavy ?? ""} ${styles["clock-time"] ?? ""}`}
            >
              {clock.time}
            </span>
            {clock.period ? (
              <span
                className={`${styles.heavy ?? ""} ${styles["clock-period"] ?? ""}`}
              >
                {clock.period}
              </span>
            ) : null}
            <span className={styles["clock-note"]}>your time</span>
          </p>
          <p className={`${styles.shadow ?? ""} ${styles.date ?? ""}`}>
            {longDate(now)}
          </p>
          <div className={styles.dial}>
            <span
              className={`${styles.gold ?? ""} ${styles.heavy ?? ""} ${styles["dial-badge"] ?? ""}`}
            >
              ON THE DIAL
            </span>
            <ul className={styles["dial-list"]}>
              <li>
                <span className={styles.heavy}>CH 01</span> TV GUIDE
              </li>
              {DIAL.map((item) => (
                <li key={item.id}>
                  <span className={styles.heavy}>{item.label}</span>{" "}
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div
          className={`${styles.gold ?? ""} ${styles.heavy ?? ""} ${styles.header ?? ""}`}
          aria-hidden="true"
        >
          <span>{date}</span>
          {slots.map((slot) => (
            <span key={slot}>{slot}</span>
          ))}
        </div>

        <section
          className={styles.listings}
          aria-label="Listings"
          onPointerEnter={() => {
            setHeld((current) => ({ ...current, hover: true }));
          }}
          onPointerLeave={() => {
            setHeld((current) => ({ ...current, hover: false }));
          }}
          onFocusIn={(event) => {
            setHeld((current) => ({ ...current, focus: true }));
            reveal(event.target);
          }}
          onFocusOut={(event) => {
            const toward = event.relatedTarget;
            if (
              !(toward instanceof Node) ||
              !event.currentTarget.contains(toward)
            )
              setHeld((current) => ({ ...current, focus: false }));
          }}
        >
          <div className={styles.track} ref={trackRef}>
            <ul className={styles.list}>
              {rows.map((row) => (
                <ListingRow
                  key={row.key}
                  row={row}
                  copy={false}
                  onTune={tune}
                />
              ))}
            </ul>
            {scrolls ? (
              <ul className={styles.list} aria-hidden="true" data-copy="true">
                {rows.map((row) => (
                  <ListingRow key={row.key} row={row} copy onTune={tune} />
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>

      <div className={styles.ticker}>
        <span
          className={`${styles.gold ?? ""} ${styles.heavy ?? ""} ${styles.live ?? ""}`}
        >
          LIVE
        </span>
        <div className={styles["crawl-window"]} aria-hidden="true">
          <span
            className={`${styles.shadow ?? ""} ${styles.crawl ?? ""}`}
            style={{
              "--crawl": `${String(Math.max(20, ticker.join("").length * 0.25))}s`,
            }}
          >
            {crawl}
          </span>
        </div>
        <ul className={styles["sr-only"]} aria-label="News">
          {ticker.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
