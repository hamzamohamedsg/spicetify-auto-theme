import test from "node:test";
import assert from "node:assert/strict";
import { hexToRGB, generateSchemeCSS, parseColorIni } from "../src/utils.js";

test("hexToRGB converts 6-character hex to comma-separated RGB", () => {
  assert.strictEqual(hexToRGB("FFFFFF"), "255,255,255");
  assert.strictEqual(hexToRGB("#152238"), "21,34,56");
  assert.strictEqual(hexToRGB("000000"), "0,0,0");
});

test("hexToRGB converts 3-character hex", () => {
  assert.strictEqual(hexToRGB("FFF"), "255,255,255");
  assert.strictEqual(hexToRGB("#000"), "0,0,0");
});

test("hexToRGB handles 8-character rgba hex or invalid strings safely", () => {
  assert.strictEqual(hexToRGB("00000000"), "0,0,0");
  assert.strictEqual(hexToRGB("invalid"), "0,0,0");
  assert.strictEqual(hexToRGB(""), "0,0,0");
  assert.strictEqual(hexToRGB(null), "0,0,0");
});

test("generateSchemeCSS creates valid :root CSS custom properties", () => {
  const colors = { main: "152238", text: "FFFFFF" };
  const css = generateSchemeCSS(colors);
  assert.match(css, /--spice-main: #152238;/);
  assert.match(css, /--spice-rgb-main: 21,34,56;/);
  assert.match(css, /--spice-text: #FFFFFF;/);
  assert.match(css, /--spice-rgb-text: 255,255,255;/);
  assert.ok(css.startsWith(":root {"));
  assert.ok(css.endsWith("}"));
});

test("parseColorIni parses sections and color keys with comments and whitespace", () => {
  const ini = `
[Dark]
text = FFFFFF
main = 121212 ; comment here

[Light]
text = 000000 # hash comment
main = FFFFFF
`;
  const result = parseColorIni(ini);
  assert.deepStrictEqual(result, {
    Dark: { text: "FFFFFF", main: "121212" },
    Light: { text: "000000", main: "FFFFFF" }
  });
});
