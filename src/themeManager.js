export const SETTINGS_KEY = "spicetify-auto-theme:settings";
export const MARKETPLACE_THEME_KEY = "marketplace:theme-installed";

export const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "schedule", // "schedule" | "system" | "custom" | "manual"
  scheduleStartHour: 7,
  scheduleEndHour: 19,
  darkScheme: "Base",
  lightScheme: "Orange",
  themeMappings: {}
};

/**
 * Built-in catalog of popular themes and their schemes to provide instant fallback
 * without requiring network fetches or IndexedDB latency.
 */
export const BUILTIN_THEME_CATALOG = {
  StarryNight: {
    Base: {
      star: "FFFFFF",
      "star-glow": "FFFFFF",
      "shooting-star": "FFFFFF",
      "shooting-star-glow": "FFFFFF",
      main: "000000",
      "main-elevated": "152238",
      card: "152238",
      sidebar: "142b44",
      "sidebar-alt": "000000",
      text: "FFFFFF",
      subtext: "ADB5BD",
      "button-active": "FFF3C4",
      button: "FFF3C4",
      "button-disabled": "000000",
      highlight: "191919",
      "highlight-elevated": "152238",
      shadow: "000000",
      "selected-row": "FFFFFF",
      misc: "7F7F7F",
      "notification-error": "E22134",
      notification: "4687d6",
      "tab-active": "333333",
      player: "181818"
    },
    Orange: {
      star: "ffe234",
      "star-glow": "fff3ad",
      "shooting-star": "fff099",
      "shooting-star-glow": "fffcea",
      main: "000000",
      "main-elevated": "e69138",
      card: "c37728",
      sidebar: "e69138",
      "sidebar-alt": "000000",
      text: "FFFFFF",
      subtext: "FFFFFF",
      "button-active": "e06666",
      button: "fbe39b",
      "button-disabled": "000000",
      highlight: "191919",
      "highlight-elevated": "e69138",
      shadow: "000000",
      "selected-row": "FFFFFF",
      misc: "f9f7db",
      "notification-error": "E22134",
      notification: "e69138",
      "tab-active": "333333",
      player: "181818"
    },
    "Cotton-candy": {
      star: "FFFFFF",
      "star-glow": "FFFFFF",
      "shooting-star": "FFFFFF",
      "shooting-star-glow": "FFFFFF",
      main: "000000",
      "main-elevated": "9f45b0",
      card: "9f45b0",
      sidebar: "509be1",
      "sidebar-alt": "ff71b2",
      text: "FFFFFF",
      subtext: "fff4f4",
      "button-active": "d3e9ff",
      button: "d3e9ff",
      "button-disabled": "FFFFFF",
      highlight: "a763b6",
      "highlight-elevated": "7f78be",
      shadow: "000000",
      "selected-row": "ffa0ad",
      misc: "7F7F7F",
      "notification-error": "E22134",
      notification: "4687d6",
      "tab-active": "333333",
      player: "181818"
    },
    Forest: {
      star: "FFFFFF",
      "star-glow": "FFFFFF",
      "shooting-star": "FFFFFF",
      "shooting-star-glow": "FFFFFF",
      main: "000000",
      "main-elevated": "011502",
      card: "011502",
      sidebar: "14442b",
      "sidebar-alt": "000000",
      text: "FFFFFF",
      subtext: "ADB5BD",
      "button-active": "9893DA",
      button: "c4c6ff",
      "button-disabled": "000000",
      highlight: "191919",
      "highlight-elevated": "011502",
      shadow: "000000",
      "selected-row": "FFFFFF",
      misc: "DBF9F4",
      "notification-error": "E22134",
      notification: "77be80",
      "tab-active": "333333",
      player: "181818"
    },
    Galaxy: {
      star: "FFFFFF",
      "star-glow": "FFFFFF",
      "shooting-star": "FFFFFF",
      "shooting-star-glow": "FFFFFF",
      main: "000000",
      "main-elevated": "9f45b0",
      card: "9f45b0",
      sidebar: "b133c9",
      "sidebar-alt": "00076f",
      text: "ffe4f2",
      subtext: "FFFFFF",
      "button-active": "FFF3C4",
      button: "FFF3C4",
      "button-disabled": "939bb6",
      highlight: "9d00ff",
      "highlight-elevated": "9d00ff",
      shadow: "000000",
      "selected-row": "FFFFFF",
      misc: "7F7F7F",
      "notification-error": "E22134",
      notification: "4687d6",
      "tab-active": "333333",
      player: "181818"
    },
    Sky: {
      star: "FFFFFF",
      "star-glow": "FFFFFF",
      "shooting-star": "FFFFFF",
      "shooting-star-glow": "FFFFFF",
      main: "000000",
      "main-elevated": "6b94f5",
      card: "6b94f5",
      sidebar: "62cff4",
      "sidebar-alt": "1e48a9",
      text: "FFFFFF",
      subtext: "040a18",
      "button-active": "FFF3C4",
      button: "FFF3C4",
      "button-disabled": "000000",
      highlight: "95b3f8",
      "highlight-elevated": "aac2f9",
      shadow: "000000",
      "selected-row": "FFFFFF",
      misc: "7F7F7F",
      "notification-error": "E22134",
      notification: "4687d6",
      "tab-active": "333333",
      player: "181818"
    },
    Sunrise: {
      star: "FFFFFF",
      "star-glow": "FFFFFF",
      "shooting-star": "FFFFFF",
      "shooting-star-glow": "FFFFFF",
      main: "000000",
      "main-elevated": "C49C48",
      card: "C49C48",
      sidebar: "F83D41",
      "sidebar-alt": "FFAE41",
      text: "FFFFFF",
      subtext: "E0E0E0",
      "button-active": "FFF3C4",
      button: "FFF3C4",
      "button-disabled": "000000",
      highlight: "191919",
      "highlight-elevated": "C49C48",
      shadow: "000000",
      "selected-row": "000000",
      misc: "7F7F7F",
      "notification-error": "E22134",
      notification: "4687d6",
      "tab-active": "333333",
      player: "181818"
    }
  },
  Comfy: {
    SolDark: {},
    Comfy: {},
    nord: {},
    "rose-pine": {}
  },
  Sleek: {
    Cherry: {},
    Deep: {},
    Dracula: {},
    Nord: {},
    SolarizedDark: {},
    Chalk: {},
    SolarizedLight: {}
  },
  Fluent: {
    dark: {},
    light: {}
  },
  Bloom: {
    dark: {},
    light: {}
  },
  Dribbblish: {
    base: {},
    white: {},
    "nord-dark": {},
    "nord-light": {},
    dracula: {}
  },
  Catppuccin: {
    mocha: {},
    macchiato: {},
    frappe: {},
    latte: {}
  }
};

/**
 * Fetches the active macOS appearance from the local bridge file os-appearance.json.
 * Returns true if dark, false if light, or null if file is unreachable.
 *
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<boolean|null>}
 */
export async function fetchOSAppearance(fetchFn = (typeof fetch !== "undefined" ? fetch : null)) {
  if (!fetchFn) return null;
  try {
    const res = await fetchFn("os-appearance.json?t=" + Date.now(), { cache: "no-store" });
    if (res && res.ok) {
      const data = await res.json();
      if (data && typeof data.appearance === "string") {
        return data.appearance.toLowerCase() === "dark";
      }
    }
  } catch {}
  return null;
}

/**
 * Determines whether the current environment should be treated as Dark mode.
 * Supports:
 * - "system": Real macOS appearance via os-appearance.json, falling back to daytime sun check.
 * - "schedule": Daytime (e.g. 07:00 to 19:00) is Light mode; Night is Dark mode.
 * - "custom": Custom user-defined hours.
 *
 * @param {{
 *   mode?: string,
 *   osAppearanceDark?: boolean|null,
 *   scheduleStartHour?: number,
 *   scheduleEndHour?: number,
 *   matchMediaDark?: boolean,
 *   currentHour?: number
 * }} param0
 * @returns {boolean}
 */
export function isCurrentAppearanceDark({
  mode = "system",
  osAppearanceDark = null,
  scheduleStartHour = 7,
  scheduleEndHour = 19,
  matchMediaDark = true,
  currentHour = (typeof new Date().getHours === "function" ? new Date().getHours() : 12)
} = {}) {
  if (mode === "system") {
    if (typeof osAppearanceDark === "boolean") {
      return osAppearanceDark;
    }
    // Fallback: If os-appearance.json is not yet available, do not blindly trust
    // CEF's forced dark matchMedia on macOS. Use daytime detection as safe fallback.
    const isDaytime = currentHour >= scheduleStartHour && currentHour < scheduleEndHour;
    return !isDaytime;
  }
  if (mode === "schedule" || mode === "custom") {
    const isDaytime = currentHour >= scheduleStartHour && currentHour < scheduleEndHour;
    return !isDaytime;
  }
  if (mode === "manual-light") return false;
  if (mode === "manual-dark") return true;
  return Boolean(matchMediaDark);
}

/**
 * Loads user settings from storage with safe fallback.
 *
 * @param {Storage|{ getItem: (key: string) => string|null }} storage
 * @returns {{ enabled: boolean, mode: string, scheduleStartHour: number, scheduleEndHour: number, darkScheme: string, lightScheme: string, themeMappings: Record<string, { darkScheme: string, lightScheme: string }> }}
 */
export function loadSettings(storage) {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_SETTINGS.enabled,
      mode: typeof parsed.mode === "string" ? parsed.mode : DEFAULT_SETTINGS.mode,
      scheduleStartHour: typeof parsed.scheduleStartHour === "number" ? parsed.scheduleStartHour : DEFAULT_SETTINGS.scheduleStartHour,
      scheduleEndHour: typeof parsed.scheduleEndHour === "number" ? parsed.scheduleEndHour : DEFAULT_SETTINGS.scheduleEndHour,
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
 * @param {typeof DEFAULT_SETTINGS} settings
 */
export function saveSettings(storage, settings) {
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Reads installed themes from Spicetify Marketplace's IndexedDB store.
 *
 * @param {IDBFactory} [idbInstance]
 * @returns {Promise<Record<string, { themeName: string, schemes: Record<string, any>, activeScheme: string, rawRecordKey: string }>>}
 */
export async function getMarketplaceThemesFromIDB(idbInstance = (typeof indexedDB !== "undefined" ? indexedDB : null)) {
  if (!idbInstance || typeof idbInstance.open !== "function") return {};
  return new Promise((resolve) => {
    try {
      const req = idbInstance.open("spicetify-marketplace");
      req.onsuccess = () => {
        try {
          const db = req.result;
          if (!db.objectStoreNames.contains("settings")) {
            db.close();
            return resolve({});
          }
          const tx = db.transaction("settings", "readonly");
          const store = tx.objectStore("settings");
          const kReq = store.getAllKeys();
          const vReq = store.getAll();
          tx.oncomplete = () => {
            db.close();
            const themes = {};
            const keys = kReq.result || [];
            const values = vReq.result || [];
            for (let i = 0; i < keys.length; i++) {
              const k = keys[i];
              if (typeof k === "string" && k.startsWith("marketplace:installed:") && !k.includes(":snippet:") && !k.includes("Extensions/")) {
                try {
                  const raw = values[i]?.value || values[i];
                  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                  if (parsed && parsed.schemes) {
                    const name = parsed.manifest?.name || parsed.title || k;
                    themes[name] = {
                      themeName: name,
                      schemes: parsed.schemes,
                      activeScheme: parsed.activeScheme || Object.keys(parsed.schemes)[0] || "",
                      rawRecordKey: k
                    };
                  }
                } catch {}
              }
            }
            resolve(themes);
          };
          tx.onerror = () => {
            db.close();
            resolve({});
          };
        } catch {
          resolve({});
        }
      };
      req.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
}

/**
 * Reads available themes and schemes from Marketplace's storage records,
 * export objects, local cached schemes, or built-in catalog.
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

    // 4. Check built-in catalog fallback for known theme
    if (currentTheme) {
      const lookupName = (currentTheme === "marketplace" || currentTheme === "Default")
        ? "StarryNight"
        : currentTheme;
      if (BUILTIN_THEME_CATALOG[lookupName]) {
        return {
          themeName: lookupName,
          schemes: BUILTIN_THEME_CATALOG[lookupName],
          activeScheme: Object.keys(BUILTIN_THEME_CATALOG[lookupName])[0] || "",
          rawRecordKey: `builtin:${lookupName}`
        };
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
 * @param {typeof DEFAULT_SETTINGS} settings
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
    const darkFallback = availableSchemes.find((s) => /base|dark|night|mocha|frappe|macchiato|black/i.test(s));
    return darkFallback || availableSchemes[0] || null;
  } else {
    const lightFallback = availableSchemes.find((s) => /orange|light|latte|day|white/i.test(s));
    return lightFallback || availableSchemes[1] || availableSchemes[0] || null;
  }
}
