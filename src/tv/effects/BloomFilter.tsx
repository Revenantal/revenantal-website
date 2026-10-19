/** The SVG filter the picture references as `url(#crt-bloom)`. */
export const BLOOM_FILTER = "url(#crt-bloom)";

/**
 * Phosphor bloom: a ±0.9 px red/blue split plus a soft 2.4 px glow. Defined once; the screen
 * applies it to the picture while the channel and performance level allow.
 *
 * @returns A hidden SVG holding the filter definition.
 */
export function BloomFilter() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: "absolute" }}
    >
      <filter
        id="crt-bloom"
        x="-2%"
        y="-2%"
        width="104%"
        height="104%"
        colorInterpolationFilters="sRGB"
      >
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="r"
        />
        <feOffset in="r" dx="-0.9" dy="0" result="r2" />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
          result="g"
        />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
          result="b"
        />
        <feOffset in="b" dx="0.9" dy="0" result="b2" />
        <feBlend in="r2" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b2" mode="screen" result="rgb" />
        <feGaussianBlur in="rgb" stdDeviation="2.4" result="bl" />
        <feComponentTransfer in="bl" result="bl2">
          <feFuncR type="linear" slope="0.55" />
          <feFuncG type="linear" slope="0.55" />
          <feFuncB type="linear" slope="0.55" />
        </feComponentTransfer>
        <feBlend in="rgb" in2="bl2" mode="screen" />
      </filter>
    </svg>
  );
}
