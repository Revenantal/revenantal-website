// @vitest-environment jsdom
import { cleanup } from "@testing-library/preact";
import { useEffect } from "preact/hooks";
import { afterEach, describe, expect, it } from "vitest";
import type { ChannelProps } from "../types";
import {
  checkPausesWhenInactive,
  checkPressStart,
  checkProjectLinks,
  checkRendersEveryCase,
  checkSideEffects,
  checkStopsOnUnmount,
  describeChannelContract,
  eagerImports,
} from "./contract";
import { FIXTURE_CASES, channelProps } from "./fixtures";
import { sampleGameManifest } from "./sample/gameManifest";
import { sampleManifest } from "./sample/manifest";

afterEach(() => {
  cleanup();
});

// The reference channel passes the whole contract, exactly as a real channel's test runs it.
describeChannelContract(sampleManifest, {
  manifestPath: "src/channels/_shared/testing/sample/manifest.ts",
});

// A game that uses the shared PRESS START screen passes the whole contract too.
describeChannelContract(sampleGameManifest, {
  manifestPath: "src/channels/_shared/testing/sample/gameManifest.ts",
});

const Links = ({ projects }: ChannelProps) => (
  <ul>
    {projects.map((project) => (
      <li key={project.id}>
        <a href={project.url} target="_blank" rel="noopener">
          {project.name}
        </a>
      </li>
    ))}
  </ul>
);

describe("channel contract catches broken channels", () => {
  it("supplies every prop, with null playlist, no live data, stale data and empty lists", () => {
    const props = channelProps();
    expect(props.broadcast).toBeNull();
    expect(props.host.tune("status")).toBe(true);
    expect(FIXTURE_CASES.map((fixture) => fixture.name)).toEqual(
      expect.arrayContaining([
        "live = null",
        "stale sources",
        "0 projects",
        "1 project",
        "30 projects",
        "no credits",
      ]),
    );
    expect(channelProps({ live: null }).servers).toEqual([]);
  });

  it("fails a channel that mutates its props", () => {
    const Mutates = (props: ChannelProps) => {
      props.projects.sort((left, right) => left.name.localeCompare(right.name));
      return <p>sorted</p>;
    };
    expect(() => {
      checkRendersEveryCase(Mutates);
    }).toThrow();
  });

  it("fails a channel that crashes without live data", () => {
    const NeedsLive = ({ live }: ChannelProps) => {
      if (!live) throw new Error("no live data");
      return <p>{live.fetchedAt}</p>;
    };
    expect(() => {
      checkRendersEveryCase(NeedsLive);
    }).toThrow();
  });

  it("fails a game that grabs the keyboard on its own or has no PRESS START", () => {
    const Grabs = ({ requestCapture }: ChannelProps) => {
      useEffect(() => {
        requestCapture();
      }, [requestCapture]);
      return <p>grabbed</p>;
    };
    const NoStart = () => <p>no start button</p>;
    expect(() => {
      checkPressStart(Grabs);
    }).toThrow(/before any click/);
    expect(() => {
      checkPressStart(NoStart);
    }).toThrow();
  });

  it("fails a directory channel that leaves a project out", () => {
    const FirstOnly = (props: ChannelProps) => (
      <Links {...props} projects={props.projects.slice(0, 1)} />
    );
    expect(() => {
      checkProjectLinks(FirstOnly);
    }).toThrow(/a link to Project 2/);
  });

  it("fails global listeners, network, storage and own audio", () => {
    const Listens = () => {
      useEffect(() => {
        const onKey = () => undefined;
        window.addEventListener("keydown", onKey);
        return () => {
          window.removeEventListener("keydown", onKey);
        };
      }, []);
      return <p>keys</p>;
    };
    const Fetches = () => {
      useEffect(() => {
        void fetch("https://elsewhere.example.invalid/").catch(() => undefined);
      }, []);
      return <p>fetch</p>;
    };
    const Stores = () => {
      useEffect(() => {
        localStorage.setItem("rv-save-x", "1");
      }, []);
      return <p>store</p>;
    };
    const Sounds = () => {
      useEffect(() => {
        new AudioContext();
      }, []);
      return <p>audio</p>;
    };
    expect(() => {
      checkSideEffects(Listens, "toy");
    }).toThrow(/global listeners/);
    expect(() => {
      checkSideEffects(Fetches, "toy");
    }).toThrow(/network requests/);
    expect(() => {
      checkSideEffects(Fetches, "toy", {
        allowNetwork: (url) => url.startsWith("https://elsewhere."),
      });
    }).not.toThrow();
    expect(() => {
      checkSideEffects(Stores, "toy");
    }).toThrow(/direct storage/);
    expect(() => {
      checkSideEffects(Sounds, "toy");
    }).toThrow(/own audio/);
  });

  it("fails a channel that keeps running or playing while inactive", () => {
    const Ticks = () => {
      useEffect(() => {
        const timer = window.setInterval(() => undefined, 100);
        return () => {
          window.clearInterval(timer);
        };
      }, []);
      return <p>tick</p>;
    };
    const Plays = ({ active, play }: ChannelProps) => {
      useEffect(() => {
        const timer = window.setTimeout(() => {
          play("blip");
        }, 3000);
        return () => {
          window.clearTimeout(timer);
        };
      }, [active, play]);
      return <p>plays</p>;
    };
    expect(() => {
      checkPausesWhenInactive(Ticks);
    }).toThrow(/timers or animation frames while inactive/);
    expect(() => {
      checkPausesWhenInactive(Plays);
    }).toThrow(/play\(\) while inactive/);
  });

  it("fails a channel that leaves a timer or callback behind after unmount", () => {
    const Leaks = ({ host }: ChannelProps) => {
      useEffect(() => {
        window.setTimeout(() => {
          host.tune("status");
        }, 3000);
      }, [host]);
      return <p>leak</p>;
    };
    expect(() => {
      checkStopsOnUnmount(Leaks);
    }).toThrow(/after unmount/);
  });

  it("finds eager imports of channel code in a manifest", () => {
    expect(
      eagerImports(
        [
          'import type { ChannelManifest } from "../_shared/types";',
          'import { helper } from "../_shared/helper";',
          'import { ChannelComponent } from "./ChannelComponent";',
          'import "./styles.css";',
        ].join("\n"),
      ),
    ).toEqual(["./ChannelComponent", "./styles.css"]);
  });
});
