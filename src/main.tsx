import { render } from "preact";
import { App } from "./App";
import { createStore } from "@data/store";
import type { StoreOptions } from "@data/store";
import { SLOT_COUNT } from "@tv/lineup";
import "@fontsource/michroma/latin-400.css";
import "@fontsource/archivo-narrow/latin-400.css";
import "@fontsource/archivo-narrow/latin-600.css";
import "@fontsource/archivo-narrow/latin-700.css";
import "@fontsource/vt323/latin-400.css";
import "@fontsource/permanent-marker/latin-400.css";
import "@styles/tokens.css";
import "@styles/reset.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("The application mount point is missing.");
}

let storage: StoreOptions["storage"];
try {
  storage = window.localStorage;
} catch {
  /* Privacy settings may block storage access. */
}
const store = createStore({ storage, positionCount: SLOT_COUNT });
render(<App store={store} />, root);
void store.load();
