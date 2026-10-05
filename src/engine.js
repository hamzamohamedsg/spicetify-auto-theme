import { generateSchemeCSS } from "./utils.js";
import {
  loadSettings,
  saveSettings,
  getAvailableSchemes,
  determineTargetScheme
} from "./themeManager.js";
import { openSettingsModal } from "./settingsModal.js";

/**
 * Initializes the auto-theme engine with dependency injection for testing.
 *
 * @param {{
 *   document?: Document,
 *   matchMedia?: (query: string) => MediaQueryList,
 *   spicetify?: typeof Spicetify
 * }} env
 */
export function initAutoTheme(env = {}) {
  const doc = env.document || (typeof document !== "undefined" ? document : null);
  const mm = env.matchMedia || (typeof window !== "undefined" && window.matchMedia ? window.matchMedia.bind(window) : null);
  const spicetify = env.spicetify || (typeof Spicetify !== "undefined" ? Spicetify : null);

  if (!doc || !mm || !spicetify) {
    console.warn("[Auto-Theme] Required environment APIs not available");
    return null;
  }

  // Create an adapter for storage interface (getItem/setItem)
  const storage = {
    getItem: (key) => {
      try {
        return spicetify.LocalStorage ? spicetify.LocalStorage.get(key) : null;
      } catch {
        return null;
      }
    },
    setItem: (key, val) => {
      try {
        if (spicetify.LocalStorage) spicetify.LocalStorage.set(key, val);
      } catch (e) {
        console.warn("[Auto-Theme] Storage save error", e);
      }
    }
  };

  let settings = loadSettings(storage);
  const mediaQuery = mm("(prefers-color-scheme: dark)");

  function applyScheme(schemeName, schemeColors, rawRecordKey) {
    if (!schemeColors || typeof schemeColors !== "object") return;

    // 1. Generate CSS custom properties
    const css = generateSchemeCSS(schemeColors, ":root");

    // 2. Inject or update the dedicated style tag
    let styleTag = doc.querySelector("style#spicetify-auto-theme");
    if (!styleTag) {
      styleTag = doc.createElement("style");
      styleTag.id = "spicetify-auto-theme";
      doc.head.appendChild(styleTag);
    }
    styleTag.innerHTML = css;

    // 3. Also update marketplace's scheme style tag if present to keep styles in sync
    const marketplaceSchemeTag = doc.querySelector("style.marketplaceCSS.marketplaceScheme");
    if (marketplaceSchemeTag) {
      marketplaceSchemeTag.innerHTML = css;
    }

    // 4. Update Spicetify Config
    if (spicetify.Config) {
      spicetify.Config.color_scheme = schemeName;
    }

    // 5. Update Marketplace stored record
    if (rawRecordKey) {
      try {
        const raw = storage.getItem(rawRecordKey);
        if (raw) {
          const record = typeof raw === "string" ? JSON.parse(raw) : raw;
          record.activeScheme = schemeName;
          storage.setItem(rawRecordKey, JSON.stringify(record));
        }
      } catch (err) {
        console.warn("[Auto-Theme] Could not update marketplace record activeScheme", err);
      }
    }

    console.log(`[Auto-Theme] Switched color scheme to: ${schemeName}`);
  }

  function evaluateAndApply(overrideIsDark) {
    if (!settings.enabled) return;

    const themeData = getAvailableSchemes(storage);
    if (!themeData || !themeData.schemes) {
      console.debug("[Auto-Theme] No theme schemes found in marketplace storage");
      return;
    }

    const availableNames = Object.keys(themeData.schemes);
    if (availableNames.length === 0) return;

    const isDark = typeof overrideIsDark === "boolean" ? overrideIsDark : Boolean(mediaQuery.matches);
    const target = determineTargetScheme(settings, isDark, availableNames);

    if (target && themeData.schemes[target]) {
      applyScheme(target, themeData.schemes[target], themeData.rawRecordKey);
    }
  }

  // Set up OS appearance change listener
  mediaQuery.addEventListener("change", (e) => {
    console.log(`[Auto-Theme] OS appearance change detected (isDark: ${e?.matches})`);
    evaluateAndApply(e?.matches);
  });

  // Register settings menu item
  if (spicetify.Menu && spicetify.Menu.Item) {
    const menuItem = new spicetify.Menu.Item("Auto Theme Settings", false, () => {
      const themeData = getAvailableSchemes(storage);
      const schemes = themeData ? Object.keys(themeData.schemes) : ["Base", "Orange"];
      const themeName = themeData ? themeData.themeName : "Unknown Theme";

      openSettingsModal({
        themeName,
        schemes,
        currentSettings: settings,
        onSave: (newSettings) => {
          settings = newSettings;
          saveSettings(storage, settings);
          evaluateAndApply();
        }
      });
    });

    if (typeof menuItem.register === "function") {
      menuItem.register();
    }
  }

  // Initial evaluation
  evaluateAndApply();

  return {
    getSettings: () => settings,
    evaluateAndApply,
    updateSettings: (newSettings) => {
      settings = newSettings;
      saveSettings(storage, settings);
      evaluateAndApply();
    }
  };
}
