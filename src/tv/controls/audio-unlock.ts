import { useEffect } from "preact/hooks";

/**
 * Unlocks audio on the first pointer-down or key press anywhere, as browsers require a
 * gesture before sound. Lives in the TV input layer, which owns window listeners; removes
 * itself after the first gesture.
 *
 * @param unlock - Creates or resumes the audio context.
 */
export function useAudioUnlock(unlock: () => void) {
  useEffect(() => {
    const onGesture = () => {
      unlock();
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
    window.addEventListener("pointerdown", onGesture, true);
    window.addEventListener("keydown", onGesture, true);
    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };
  }, [unlock]);
}
