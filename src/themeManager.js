export const SETTINGS_KEY = "spicetify-auto-theme:settings";
export const MARKETPLACE_THEME_KEY = "marketplace:theme-installed";

export const DEFAULT_SETTINGS = {
  enabled: true,
  darkScheme: "Base",
  lightScheme: "Orange",
  themeMappings: {}
};

/**
 * Loads user settings from storage with safe fallback.
 *
 * @param {Storage|{ getItem: (key: string) => string|null }} storage
 * @returns {{ enabled: boolean, darkScheme: string, lightScheme: string, themeMappings: Record<string, { darkScheme: string, lightScheme: string }> }}
 */
export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SETTINGS.enabled,
      darkScheme: typeof parsed.darkScheme === "string" ? parsed.darkScheme : DEFAULT_SETTINGS.darkScheme,
      lightScheme: typeof parsed.lightScheme === "string" ? parsed.lightScheme : DEFAULT_SETTINGS.lightScheme,
      themeMappings: typeof parsed.themeMappings === "object" && parsed.themeMappings !== null ? parsed.themeMappings : {}
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persists user settings into storage.
 *
 * @param {Storage|{ setItem: (key: string, val: string) => void }} storage
 * @param {{ enabled: boolean, darkScheme: string, lightScheme: string, themeMappings?: Record<string, { darkScheme: string, lightScheme: string }> }} settings
 */
export function saveSettings(storage, settings) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Reads available themes and schemes from Marketplace's storage records,
 * export objects, or local cached schemes.
 *
 * @param {Storage|{ getItem: (key: string) => string|null }} storage
 * @param {Record<string, any>} [marketplaceExport]
 * @param {string} [currentTheme]
 * @returns {{ themeName: string, schemes: Record<string, Record<string, string>>, activeScheme: string, rawRecordKey: string } | null}
 */
export function getAvailableSchemes(storage, marketplaceExport, currentTheme) {
  try {
    // 1. Check direct Marketplace theme key in storage
    const themeKey = storage.getItem(MARKETPLACE_THEME_KEY);
    if (themeKey) {
      const rawData = storage.getItem(themeKey);
      if (rawData) {
        const record = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
        if (record && typeof record === "object") {
          const schemes = record.schemes || {};
          const themeName = record.manifest?.name || record.title || currentTheme || "Theme";
          const activeScheme = record.activeScheme || Object.keys(schemes)[0] || "";
          return { themeName, schemes, activeScheme, rawRecordKey: themeKey };
        }
      }
    }

    // 2. Check Marketplace export if provided
    if (marketplaceExport && typeof marketplaceExport === "object") {
      for (const [key, rawVal] of Object.entries(marketplaceExport)) {
        if (!key.startsWith("marketplace:installed:")) continue;
        const record = typeof rawVal === "string" ? JSON.parse(rawVal) : rawVal;
        if (record && record.schemes) {
          const name = record.manifest?.name || record.title;
          if (!currentTheme || (name && name.toLowerCase() === currentTheme.toLowerCase())) {
            return {
              themeName: name || currentTheme || "Theme",
              schemes: record.schemes,
              activeScheme: record.activeScheme || Object.keys(record.schemes)[0] || "",
              rawRecordKey: key
            };
          }
        }
      }
    }

    // 3. Check local schemes cache for current theme
    if (currentTheme) {
      const cached = storage.getItem(`spicetify-auto-theme-schemes:${currentTheme}`);
      if (cached) {
        const schemes = JSON.parse(cached);
        if (schemes && typeof schemes === "object") {
          return {
            themeName: currentTheme,
            schemes,
            activeScheme: Object.keys(schemes)[0] || "",
            rawRecordKey: `spicetify-auto-theme-schemes:${currentTheme}`
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.warn("[Auto-Theme] Failed to read theme scheme data", err);
    return null;
  }
}

/**
 * Determines which scheme to apply given current settings, dark mode state,
 * list of available schemes, and active theme name.
 *
 * @param {{ enabled: boolean, darkScheme: string, lightScheme: string, themeMappings?: Record<string, { darkScheme: string, lightScheme: string }> }} settings
 * @param {boolean} isDark
 * @param {string[]} [availableSchemes=[]]
 * @param {string} [currentTheme=null]
 * @returns {string|null}
 */
export function determineTargetScheme(settings, isDark, availableSchemes = [], currentTheme = null) {
  if (!settings || !settings.enabled) {
    return null;
  }

  // Check per-theme mapping first
  let themeConfig = null;
  if (currentTheme && settings.themeMappings && settings.themeMappings[currentTheme]) {
    themeConfig = settings.themeMappings[currentTheme];
  }

  const desired = themeConfig
    ? (isDark ? themeConfig.darkScheme : themeConfig.lightScheme)
    : (isDark ? settings.darkScheme : settings.lightScheme);

  if (!desired) return null;

  // If no available schemes list is known (e.g. custom theme), trust user's chosen scheme
  if (!availableSchemes || availableSchemes.length === 0) {
    return desired;
  }

  if (availableSchemes.includes(desired)) {
    return desired;
  }

  // Graceful fallback if configured scheme doesn't exist in current theme
  if (isDark) {
    const darkFallback = availableSchemes.find((s) => /base|dark|night|mocha|frappe|macchiato/i.test(s));
    return darkFallback || availableSchemes[0] || null;
  } else {
    const lightFallback = availableSchemes.find((s) => /orange|light|latte|day|white/i.test(s));
    return lightFallback || availableSchemes[1] || availableSchemes[0] || null;
  }
}
