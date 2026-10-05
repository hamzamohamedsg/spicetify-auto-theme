export const SETTINGS_KEY = "spicetify-auto-theme:settings";
export const MARKETPLACE_THEME_KEY = "marketplace:theme-installed";

export const DEFAULT_SETTINGS = {
  enabled: true,
  darkScheme: "Base",
  lightScheme: "Orange"
};

/**
 * Loads user settings from storage with safe fallback.
 *
 * @param {Storage|{ getItem: (key: string) => string|null }} storage
 * @returns {{ enabled: boolean, darkScheme: string, lightScheme: string }}
 */
export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SETTINGS.enabled,
      darkScheme: typeof parsed.darkScheme === "string" ? parsed.darkScheme : DEFAULT_SETTINGS.darkScheme,
      lightScheme: typeof parsed.lightScheme === "string" ? parsed.lightScheme : DEFAULT_SETTINGS.lightScheme
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persists user settings into storage.
 *
 * @param {Storage|{ setItem: (key: string, val: string) => void }} storage
 * @param {{ enabled: boolean, darkScheme: string, lightScheme: string }} settings
 */
export function saveSettings(storage, settings) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Reads available themes and schemes from Marketplace's storage records.
 *
 * @param {Storage|{ getItem: (key: string) => string|null }} storage
 * @returns {{ themeName: string, schemes: Record<string, Record<string, string>>, activeScheme: string, rawRecordKey: string } | null}
 */
export function getAvailableSchemes(storage) {
  try {
    const themeKey = storage.getItem(MARKETPLACE_THEME_KEY);
    if (!themeKey) return null;

    const rawData = storage.getItem(themeKey);
    if (!rawData) return null;

    const record = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    if (!record || typeof record !== "object") return null;

    const schemes = record.schemes || {};
    const themeName = record.manifest?.name || record.title || "Unknown Theme";
    const activeScheme = record.activeScheme || Object.keys(schemes)[0] || "";

    return {
      themeName,
      schemes,
      activeScheme,
      rawRecordKey: themeKey
    };
  } catch (err) {
    console.warn("[Auto-Theme] Failed to read marketplace theme data", err);
    return null;
  }
}

/**
 * Determines which scheme to apply given current settings, dark mode state,
 * and list of available schemes.
 *
 * @param {{ enabled: boolean, darkScheme: string, lightScheme: string }} settings
 * @param {boolean} isDark
 * @param {string[]} availableSchemes
 * @returns {string|null}
 */
export function determineTargetScheme(settings, isDark, availableSchemes) {
  if (!settings || !settings.enabled) {
    return null;
  }

  const desired = isDark ? settings.darkScheme : settings.lightScheme;

  if (availableSchemes.includes(desired)) {
    return desired;
  }

  // Graceful fallback if configured scheme doesn't exist in current theme
  if (isDark) {
    // Try common dark names
    const darkFallback = availableSchemes.find((s) => /base|dark|night|mocha|frappe|macchiato/i.test(s));
    return darkFallback || availableSchemes[0] || null;
  } else {
    // Try common light names
    const lightFallback = availableSchemes.find((s) => /orange|light|latte|day|white/i.test(s));
    return lightFallback || availableSchemes[1] || availableSchemes[0] || null;
  }
}
