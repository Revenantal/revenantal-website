import { resolve } from "node:path";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({
  overrideConfig: [tseslint.configs.disableTypeChecked],
});

describe("architecture enforcement", () => {
  it.each(["data", "list", "audio", "tv", "channels/fixture"])(
    "rejects an import of the app from %s",
    async (folder) => {
      const depth = folder.split("/").length;
      const [result] = await eslint.lintText(
        `import "${"../".repeat(depth)}App";`,
        { filePath: resolve(`src/${folder}/fixture.ts`) },
      );

      expect(
        result?.messages.some(
          (message) => message.ruleId === "boundaries/dependencies",
        ),
      ).toBe(true);
    },
  );

  it("allows the entry point to compose the app", async () => {
    const [result] = await eslint.lintText('import "./App";', {
      filePath: resolve("src/fixture.ts"),
    });

    expect(result?.errorCount).toBe(0);
  });

  it("keeps the channel contract fixtures out of application code", async () => {
    const source =
      'import { channelProps } from "../_shared/testing/fixtures";';
    const [app] = await eslint.lintText(source, {
      filePath: resolve("src/channels/fixture/ChannelComponent.tsx"),
    });
    const [test] = await eslint.lintText(source, {
      filePath: resolve("src/channels/fixture/fixture.test.tsx"),
    });

    expect(
      app?.messages.some(
        (message) => message.ruleId === "no-restricted-imports",
      ),
    ).toBe(true);
    expect(
      test?.messages.some(
        (message) => message.ruleId === "no-restricted-imports",
      ),
    ).toBe(false);
  });

  it("rejects default exports in application code", async () => {
    const [result] = await eslint.lintText("export default 1;", {
      filePath: resolve("src/fixture.ts"),
    });

    expect(
      result?.messages.some(
        (message) => message.ruleId === "no-restricted-syntax",
      ),
    ).toBe(true);
  });
});
