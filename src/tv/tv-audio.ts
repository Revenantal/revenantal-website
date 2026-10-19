import { createAudioEngine } from "@audio/engine";
import type { AudioEngine } from "@audio/engine";

let engine: AudioEngine | null = null;

/**
 * The page's one TV audio engine, created on first use. It outlives TV/List switches, so
 * sound stays unlocked when the viewer turns the TV back on.
 *
 * @returns The shared engine.
 */
export function tvAudio(): AudioEngine {
  engine ??= createAudioEngine();
  return engine;
}

/**
 * Unlocks audio from a gesture outside the TV, such as List mode's Turn on the TV button.
 */
export function unlockTvAudio() {
  void tvAudio().unlock();
}
