// @vitest-environment jsdom
import { describeChannelContract } from "../_shared/testing/contract";
import { manifest } from "./manifest";
import { WEATHER_PATHS } from "./weather";

// The forecast, radar and bundled map are the Guide's only allowed requests.
describeChannelContract(manifest, {
  allowNetwork: (url) => WEATHER_PATHS.some((path) => url.startsWith(path)),
});
