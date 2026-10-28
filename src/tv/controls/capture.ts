import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

/** Marks the channel picture; a pointer press outside it hands the keys back. */
export const GLASS_SELECTOR = "[data-channel]";

/**
 * Whether the browser says the viewer just acted on the page. Where the API is missing
 * (older Safari), a request is accepted because it can only come from a channel's own
 * PRESS START control.
 *
 * @returns True when a capture request may be granted.
 */
export function hasUserActivation(): boolean {
  const activation = (navigator as { userActivation?: { isActive: boolean } })
    .userActivation;
  return activation ? activation.isActive : true;
}

/** What the capture layer gives the frame for one tuned channel. */
export type Capture = {
  /** Whether this scope holds the keyboard. */
  captured: boolean;
  /** Takes the keyboard for the scope at `owner`, after a user gesture. */
  requestFor: (owner: number) => () => void;
  /** Hands the keys back if the scope at `owner` holds them; safe to call repeatedly. */
  releaseFor: (owner: number) => () => void;
};

/**
 * Keyboard capture for the tuned channel. Only the shown channel can hold it, and it is
 * dropped on Esc, a press outside the glass, a new tune, power off, a hidden tab or
 * detuning. The listeners live here, in the TV input layer; channels never add their own.
 *
 * @param shown - The position on the glass.
 * @param active - Whether that channel is active (powered, visible, tuned in).
 * @returns The capture state and the bound request/release callbacks.
 */
export function useCapture(shown: number, active: boolean): Capture {
  const [owner, setOwner] = useState<number | null>(null);
  const ownerRef = useRef(owner);
  useEffect(() => {
    ownerRef.current = owner;
  });
  const captured = active && owner === shown;

  // Any change of channel or loss of activity ends the capture.
  useEffect(() => {
    if (!active) setOwner(null);
  }, [active]);
  useEffect(() => {
    setOwner((current) => (current === shown ? current : null));
  }, [shown]);

  useEffect(() => {
    if (!captured) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOwner(null);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(GLASS_SELECTOR)) return;
      setOwner(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [captured]);

  const requestFor = useCallback(
    (position: number) => () => {
      if (hasUserActivation()) setOwner(position);
    },
    [],
  );
  const releaseFor = useCallback(
    (position: number) => () => {
      setOwner((current) => (current === position ? null : current));
    },
    [],
  );
  return useMemo(
    () => ({ captured, requestFor, releaseFor }),
    [captured, requestFor, releaseFor],
  );
}
