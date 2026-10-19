/**
 * Updates the shared clock and refreshes immediately when a hidden tab returns.
 *
 * @param tick - Store clock action supplied by the application host.
 * @returns Cleanup that removes the timer and visibility listener.
 */
export function startPageClock(tick: (now: Date) => void): () => void {
  const update = () => {
    tick(new Date());
  };
  const visible = () => {
    if (document.visibilityState === "visible") update();
  };
  const timer = setInterval(update, 20_000);
  document.addEventListener("visibilitychange", visible);
  update();
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", visible);
  };
}
