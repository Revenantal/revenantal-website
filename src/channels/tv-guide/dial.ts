import channels from "./dial.json";

/** Another channel on the dial, listed in the station box and the listings. */
export type DialChannel = {
  id: string;
  /** The dial label, for example "CH 10". */
  label: string;
  title: string;
  blurb: string;
};

/**
 * The other built channels, kept by hand next to the registry (a check keeps them in step).
 * The Guide cannot read the registry itself.
 */
export const DIAL: DialChannel[] = channels;
