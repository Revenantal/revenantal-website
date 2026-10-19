import captured from "./promos.json";

/** Another built channel, with a still captured by `pnpm promos`. */
export type Promo = {
  id: string;
  /** The dial label at capture time, for example "CH 10". */
  label: string;
  title: string;
  blurb: string;
  image: string;
};

/** The promos `pnpm promos` last captured; never the TV Guide itself. */
export const PROMOS: Promo[] = captured;
