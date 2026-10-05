import test from "node:test";
import assert from "node:assert/strict";
import {
  loadSettings,
  saveSettings,
  determineTargetScheme,
  getAvailableSchemes,
  isCurrentAppearanceDark,
  DEFAULT_SETTINGS
} from "../src/themeManager.js";

test("loadSettings returns defaults when storage is empty", () => {
  const mockStorage = { getItem: () => null, setItem: () => {} };
  const settings = loadSettings(mockStorage);
  assert.deepStrictEqual(settings, DEFAULT_SETTINGS);
});

test("saveSettings and loadSettings persist custom configuration", () => {
  const store = {};
  const mockStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; }
  };
  saveSettings(mockStorage, { enabled: false, darkScheme: "Dark", lightScheme: "Light" });
  assert.deepStrictEqual(loadSettings(mockStorage), {
    enabled: false,
    mode: "schedule",
    scheduleStartHour: 7,
    scheduleEndHour: 19,
    darkScheme: "Dark",
    lightScheme: "Light",
    themeMappings: {}
  });
});

test("determineTargetScheme picks darkScheme when isDark is true", () => {
  const settings = { enabled: true, darkScheme: "Base", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, true, ["Base", "Orange", "Galaxy"]);
  assert.strictEqual(target, "Base");
});

test("determineTargetScheme picks lightScheme when isDark is false", () => {
  const settings = { enabled: true, darkScheme: "Base", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, false, ["Base", "Orange", "Galaxy"]);
  assert.strictEqual(target, "Orange");
});

test("determineTargetScheme falls back gracefully when scheme does not exist", () => {
  const settings = { enabled: true, darkScheme: "NonExistent", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, true, ["Base", "Orange"]);
  assert.strictEqual(target, "Base");
});

test("determineTargetScheme returns null when auto-switch is disabled", () => {
  const settings = { enabled: false, darkScheme: "Base", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, true, ["Base", "Orange"]);
  assert.strictEqual(target, null);
});

test("getAvailableSchemes parses schemes from Marketplace storage record", () => {
  const themeRecord = {
    manifest: { name: "StarryNight" },
    schemes: {
      Base: { main: "000000", text: "FFFFFF" },
      Orange: { main: "FFA500", text: "000000" }
    },
    activeScheme: "Base"
  };
  const mockStorage = {
    getItem: (key) => {
      if (key === "marketplace:theme-installed") return "marketplace:installed:spicetify/StarryNight/user.css";
      if (key === "marketplace:installed:spicetify/StarryNight/user.css") return JSON.stringify(themeRecord);
      return null;
    }
  };

  const result = getAvailableSchemes(mockStorage);
  assert.ok(result);
  assert.strictEqual(result.themeName, "StarryNight");
  assert.deepStrictEqual(Object.keys(result.schemes), ["Base", "Orange"]);
  assert.strictEqual(result.activeScheme, "Base");
});

test("getAvailableSchemes returns null when no theme installed", () => {
  const mockStorage = { getItem: () => null };
  const result = getAvailableSchemes(mockStorage);
  assert.strictEqual(result, null);
});

test("determineTargetScheme uses per-theme mapping if defined for current theme", () => {
  const settings = {
    enabled: true,
    darkScheme: "Base",
    lightScheme: "Orange",
    themeMappings: {
      Comfy: { darkScheme: "SolDark", lightScheme: "Comfy" },
      Fluent: { darkScheme: "dark", lightScheme: "light" }
    }
  };
  const darkTarget = determineTargetScheme(settings, true, ["SolDark", "Comfy"], "Comfy");
  assert.strictEqual(darkTarget, "SolDark");

  const lightTarget = determineTargetScheme(settings, false, ["SolDark", "Comfy"], "Comfy");
  assert.strictEqual(lightTarget, "Comfy");
});

test("determineTargetScheme returns desired scheme directly if availableSchemes is empty", () => {
  const settings = { enabled: true, darkScheme: "MyCustomDark", lightScheme: "MyCustomLight" };
  const target = determineTargetScheme(settings, true, []);
  assert.strictEqual(target, "MyCustomDark");
});

test("isCurrentAppearanceDark returns false during daytime when mode is schedule", () => {
  const isDark = isCurrentAppearanceDark({
    mode: "schedule",
    scheduleStartHour: 7,
    scheduleEndHour: 19,
    currentHour: 8
  });
  assert.strictEqual(isDark, false);
});

test("isCurrentAppearanceDark returns true during nighttime when mode is schedule", () => {
  const isDarkNight = isCurrentAppearanceDark({
    mode: "schedule",
    scheduleStartHour: 7,
    scheduleEndHour: 19,
    currentHour: 21
  });
  assert.strictEqual(isDarkNight, true);

  const isDarkEarly = isCurrentAppearanceDark({
    mode: "schedule",
    scheduleStartHour: 7,
    scheduleEndHour: 19,
    currentHour: 5
  });
  assert.strictEqual(isDarkEarly, true);
});

test("isCurrentAppearanceDark respects system matchMedia when mode is system", () => {
  assert.strictEqual(isCurrentAppearanceDark({ mode: "system", matchMediaDark: true }), true);
  assert.strictEqual(isCurrentAppearanceDark({ mode: "system", matchMediaDark: false }), false);
});

