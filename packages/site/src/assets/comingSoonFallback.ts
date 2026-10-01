/**
 * A neutral, dot-textured placeholder — no photo, no baked-in text (the
 * "Coming soon" label lives in the tile's own Badge, not the image). An
 * inline SVG data URI, so there's no external asset to source or license
 * — see design spec, Visual Direction, for why nothing on this site reaches
 * for a sourced/commissioned image.
 */
export const COMING_SOON_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
      `<rect width="400" height="300" fill="#2d2d44" />` +
      `<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">` +
      `<circle cx="2" cy="2" r="1.4" fill="#4a4a68" />` +
      `</pattern>` +
      `<rect width="400" height="300" fill="url(#dots)" />` +
      `</svg>`
  );
