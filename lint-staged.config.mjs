export default {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "src/**/*.css": ["stylelint --fix", "prettier --write"],
  "*.{json,md,yml,yaml,mjs}": "prettier --write --ignore-unknown",
};
