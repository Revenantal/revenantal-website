import { render } from "preact";
import { App } from "./App";
import "@styles/tokens.css";
import "@styles/reset.css";

const root = document.getElementById("app");

if (!root) {
  throw new Error("The application mount point is missing.");
}

render(<App />, root);
