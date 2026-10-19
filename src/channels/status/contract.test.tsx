// @vitest-environment jsdom
import { describeChannelContract } from "../_shared/testing/contract";
import { manifest } from "./manifest";

describeChannelContract(manifest);
