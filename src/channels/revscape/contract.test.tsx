// @vitest-environment jsdom
import { vi } from "vitest";
import { describeChannelContract } from "../_shared/testing/contract";
import { manifest } from "./manifest";

// jsdom has no WebGL, so the contract runs the real channel against a stand-in 3D view.
// The no-WebGL path has its own test (fallback.test.tsx).
vi.mock("./scene", () => ({
  VIEW: { width: 512, height: 384 },
  createScene: () => ({
    render: () => undefined,
    dispose: () => undefined,
    stats: () => ({ triangles: 0, calls: 0 }),
  }),
}));

describeChannelContract(manifest);
