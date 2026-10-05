/**
 * Converts a hex color string to a comma-separated RGB string (e.g. "255,255,255").
 * Supports 3-char, 6-char, and 8-char hex values with or without leading '#'.
 * Gracefully falls back to "0,0,0" for invalid inputs.
 *
 * @param {string} hex
 * @returns {string}
 */
export function hexToRGB(hex) {
  if (!hex || typeof hex !== "string") {
    return "0,0,0";
  }

  let clean = hex.trim().replace(/^#/, "");

  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  } else if (clean.length === 8) {
    // If 8-character (RGBA), take the first 6 characters (RGB)
    clean = clean.slice(0, 6);
  }

  if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
    return "0,0,0";
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  return `${r},${g},${b}`;
}

/**
 * Generates CSS rules containing --spice-* and --spice-rgb-* custom properties
 * for a given scheme colors object.
 *
 * @param {Record<string, string>} schemeColors
 * @param {string} [targetSelector=":root"]
 * @returns {string}
 */
export function generateSchemeCSS(schemeColors, targetSelector = ":root") {
  if (!schemeColors || typeof schemeColors !== "object") {
    return "";
  }

  const lines = [`${targetSelector} {`];

  for (const [key, rawValue] of Object.entries(schemeColors)) {
    if (!rawValue) continue;
    const cleanHex = rawValue.trim().replace(/^#/, "");
    lines.push(`  --spice-${key}: #${cleanHex};`);
    lines.push(`  --spice-rgb-${key}: ${hexToRGB(cleanHex)};`);
  }

  lines.push("}");
  return lines.join("\n");
}
