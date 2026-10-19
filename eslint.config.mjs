import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import jsxA11y from "eslint-plugin-jsx-a11y";
import jsdoc from "eslint-plugin-jsdoc";
import hooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

const typedFiles = [
  "src/**/*.{ts,tsx}",
  "tools/**/*.ts",
  "jobs/**/*.ts",
  "agent/**/*.ts",
  "api/**/*.ts",
  "vite.config.ts",
];
const architecturalFiles = [
  "src/**/*.{ts,tsx}",
  "jobs/**/*.ts",
  "agent/**/*.ts",
  "api/**/*.ts",
];
const element = (type) => ({ element: { type } });
const allow = (from, to) => ({
  from: element(from),
  allow: { to: element(to) },
});

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "docs/reference/**",
      ".husky/**",
    ],
  },
  {
    files: typedFiles,
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [
      "src/**/*.{ts,tsx}",
      "tools/**/*.ts",
      "jobs/**/*.ts",
      "agent/**/*.ts",
      "api/**/*.ts",
    ],
    plugins: { jsdoc },
    settings: { jsdoc: { mode: "typescript" } },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          contexts: [
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
            "ExportNamedDeclaration > TSInterfaceDeclaration",
            "ExportNamedDeclaration > VariableDeclaration",
          ],
        },
      ],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-returns": "error",
    },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { "jsx-a11y": jsxA11y, "react-hooks": hooks },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...hooks.configs.recommended.rules,
    },
  },
  {
    files: architecturalFiles,
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { project: "./tsconfig.json" } },
      "boundaries/root-path": import.meta.dirname,
      "boundaries/files": [
        { pattern: "src/*.{ts,tsx,css}", category: "entry" },
        { pattern: "src/channels/index.ts", category: "registry" },
      ],
      "boundaries/elements": [
        { type: "shared", pattern: "src/channels/_shared" },
        { type: "channel", pattern: "src/channels/*", capture: ["id"] },
        ...["data", "tv", "list", "audio", "styles"].map((type) => ({
          type,
          pattern: `src/${type}`,
        })),
        ...["jobs", "agent", "api"].map((type) => ({
          type,
          pattern: `${type}/*`,
        })),
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/no-unknown-dependencies": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { file: { categories: "entry" } },
              allow: [
                { to: element(["data", "tv", "list", "styles"]) },
                { to: { file: { categories: "entry" } } },
              ],
            },
            allow("tv", ["data", "audio", "shared"]),
            {
              from: element("tv"),
              allow: { to: { file: { categories: "registry" } } },
            },
            allow("list", "data"),
            allow("audio", "data"),
            allow("channel", "shared"),
            {
              from: element(["jobs", "agent", "api"]),
              allow: {
                to: {
                  element: { type: "data", fileInternalPath: "schemas.ts" },
                },
              },
            },
            {
              from: element(["channel", "shared", "jobs", "agent", "api"]),
              dependency: { kind: "type" },
              allow: {
                to: { element: { type: "data", fileInternalPath: "types.ts" } },
              },
            },
            {
              from: { file: { categories: "registry" } },
              allow: {
                to: {
                  element: { type: "channel", fileInternalPath: "manifest.ts" },
                },
              },
            },
            {
              from: { file: { categories: "registry" } },
              allow: { to: element("shared") },
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports in application modules.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "Use preact or preact/hooks." },
            { name: "react-dom", message: "Use preact." },
          ],
        },
      ],
    },
  },
  {
    // The channel contract fixtures import Vitest; only tests may use them.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/channels/_shared/testing/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "Use preact or preact/hooks." },
            { name: "react-dom", message: "Use preact." },
          ],
          patterns: [
            {
              group: ["**/_shared/testing", "**/_shared/testing/**"],
              message: "Test-only fixtures: import them from test files.",
            },
          ],
        },
      ],
    },
  },
  prettier,
);
