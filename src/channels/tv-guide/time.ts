/** Clock and listing times, always in the viewer's own time zone and locale. */

/**
 * The time split into its digits and day period, for the big station clock.
 *
 * @param now - The display clock.
 * @param locale - Locale override (tests only).
 * @returns For example { time: "7:42", period: "PM" }, or an empty period in 24-hour locales.
 */
export function clockParts(
  now: Date,
  locale?: string,
): { time: string; period: string } {
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(now);
  const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const time = parts
    .filter((part) => part.type !== "dayPeriod")
    .map((part) => part.value)
    .join("")
    .trim();
  return { time, period: period.toUpperCase() };
}

/**
 * The long date under the clock.
 *
 * @param now - The display clock.
 * @param locale - Locale override (tests only).
 * @returns For example "SUNDAY · OCTOBER 18".
 */
export function longDate(now: Date, locale?: string): string {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
    now,
  );
  const day = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
  }).format(now);
  return `${weekday} · ${day}`.toUpperCase();
}

/**
 * The listing grid's three half-hour slots, starting at the current half hour.
 *
 * @param now - The display clock.
 * @param locale - Locale override (tests only).
 * @returns The short date and three slot labels, for example "SUN 10/18" and "7:30 PM".
 */
export function listingSlots(
  now: Date,
  locale?: string,
): { date: string; slots: string[] } {
  const start = new Date(now);
  start.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
  const date = `${new Intl.DateTimeFormat(locale, { weekday: "short" }).format(now)} ${new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric" }).format(now)}`;
  return {
    date: date.toUpperCase(),
    slots: [0, 1, 2].map((step) =>
      time.format(new Date(start.getTime() + step * 30 * 60_000)),
    ),
  };
}

/**
 * How long ago something happened, in words.
 *
 * @param iso - The moment.
 * @param now - The display clock.
 * @param locale - Locale override (tests only).
 * @returns For example "2 hours ago"; null when unreadable.
 */
export function timeAgo(
  iso: string,
  now: Date,
  locale?: string,
): string | null {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  const minutes = Math.round((then - now.getTime()) / 60_000);
  if (minutes === 0) return "just now";
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}
