# Dial Configuration

One unnumbered knob tunes through configurable slots. There is no fixed capacity. Numeric positions are internal identifiers and may appear in the OSD and shared URLs; they are not printed around the knob.

## Registry

`src/channels/index.ts` is the sole registry, keyed by positive integer positions. Values are manifests or null. Missing keys inside the range and explicit null values show NO SIGNAL. The highest configured key defines the range; a trailing null adds a final blank slot. There is no separate capacity constant.

For example, `{ 1: tvGuide, 3: null, 10: status, 11: credits }` has eleven slots. Slots 2–9 are blank until assigned. Adding a channel at 14 grows the dial to fourteen slots without moving earlier assignments. This example does not approve a channel build.

Validate canonical positive safe-integer keys, unique channel IDs and valid manifests before computing the range. Reject empty/all-null registries and zero, negative, fractional, unsafe or nonnumeric keys. Use sparse lookup and arithmetic rather than allocating an array up to the highest key. Built-channel count and insertion order do not define capacity.

## Tuning

For N slots, each detent spans 360/N degrees. Next/previous, wheel, drag snapping, between-detent effects and shortest-path rotation all use N and this angle. Wrap at the ends and visit blanks normally. Keep accumulated rotation so wraparound does not reverse through a whole turn. One-slot configurations stay on that slot; half-turn ties use a consistent direction.

Keep click, wheel and arrow keys available when a large lineup makes dragging less precise. The knob is one focusable control with a target at least 44 screen pixels at 1280×650. No numeral ring, numeral buttons, hidden hit zones or number-key shortcuts at any size. The OSD and dial label identify the selected programme or NO SIGNAL.

## Stability and Verification

Never compact gaps or move assigned positions. Null a removed entry, including the highest one, to retain its old URL. Internal buttons resolve stable channel IDs. Validate URL/storage positions against the current range; never wrap external input into another channel. Invalid hashes fall through to a valid saved position, then TV Guide. In-range blanks remain NO SIGNAL.

Tasks 2.3–2.4 and 2.7–2.8 must test sparse/null slots, growth beyond twelve slots, removing the highest channel, invalid keys, duplicate IDs, one-slot navigation, odd/even wraparound, shortest rotation, drag snapping and cancellation. Check mouse, wheel, keyboard, capture release, power-off and the laptop/full-size target. Recheck saved positions and hashes after growing the lineup. Application verification remains pending.
