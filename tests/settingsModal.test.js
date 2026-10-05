import test from "node:test";
import assert from "node:assert/strict";
import { generateModalHTML, parseModalFormValues } from "../src/settingsModal.js";

test("generateModalHTML includes theme title, toggle, and dropdown options", () => {
  const html = generateModalHTML({
    themeName: "StarryNight",
    schemes: ["Base", "Orange", "Galaxy"],
    settings: { enabled: true, darkScheme: "Base", lightScheme: "Orange" }
  });

  assert.match(html, /Auto Theme Settings/);
  assert.match(html, /StarryNight/);
  assert.match(html, /name="auto-theme-enabled"[^>]*checked/);
  assert.match(html, /<option value="Base" selected>/);
  assert.match(html, /<option value="Orange" selected>/);
  assert.match(html, /<option value="Galaxy">/);
});

test("generateModalHTML handles unchecked toggle when disabled", () => {
  const html = generateModalHTML({
    themeName: "TestTheme",
    schemes: ["Dark", "Light"],
    settings: { enabled: false, darkScheme: "Dark", lightScheme: "Light" }
  });

  assert.doesNotMatch(html, /name="auto-theme-enabled"[^>]*checked/);
});

test("parseModalFormValues extracts updated settings from form inputs", () => {
  const values = parseModalFormValues({
    enabled: true,
    darkScheme: "Base",
    lightScheme: "Orange"
  });

  assert.deepStrictEqual(values, {
    enabled: true,
    darkScheme: "Base",
    lightScheme: "Orange"
  });
});
