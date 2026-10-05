import { generateSchemeCSS, parseColorIni } from "./utils.js";
import {
  loadSettings,
  saveSettings,
  getAvailableSchemes,
  determineTargetScheme
} from "./themeManager.js";
import { openSettingsModal } from "./settingsModal.js";

/**
 * Initializes the universal auto-theme engine with dependency injection for testing.
 *
 * @param {{
 *   document?: Document,
 *   matchMedia?: (query: string) => MediaQueryList,
 *   spicetify?: typeof Spicetify,
 *   fetch?: typeof fetch
 * }} env
 */
export function initAutoTheme(env = {}) {
  const doc = env.document || (typeof document !== "undefined" ? document : null);
  const mm = env.matchMedia || (typeof window !== "undefined" && window.matchMedia ? window.matchMedia.bind(window) : null);
  const spicetify = env.spicetify || (typeof Spicetify !== "undefined" ? Spicetify : null);
  const fetchFn = env.fetch || (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);

  if (!doc || !mm || !spicetify) {
    console.warn("[Auto-Theme] Required environment APIs not available");
    return null;
  }

  // Create an adapter for storage interface (getItem/setItem)
  const storage = {
    getItem: (key) => {
      try {
        if (spicetify.LocalStorage) {
          const val = spicetify.LocalStorage.get(key);
          if (val !== null && val !== undefined) return val;
        }
        if (typeof localStorage !== "undefined") {
          return localStorage.getItem(key);
        }
        return null;
      } catch {
        return null;
      }
    },
    setItem: (key, val) => {
      try {
        if (spicetify.LocalStorage) spicetify.LocalStorage.set(key, val);
        if (typeof localStorage !== "undefined") localStorage.setItem(key, val);
      } catch (e) {
        console.warn("[Auto-Theme] Storage save error", e);
      }
    }
  };

  let settings = loadSettings(storage);
  const mediaQuery = mm("(prefers-color-scheme: dark)");

  function getCurrentThemeName() {
    return spicetify.Config?.current_theme || "Default";
  }

  function getMarketplaceExport() {
    try {
      if (typeof window !== "undefined" && window.Marketplace && typeof window.Marketplace.export === "function") {
        return window.Marketplace.export();
      }
    } catch {}
    return null;
  }

  async function resolveThemeData(themeName) {
    // 1. Check local / marketplace storage
    let themeData = getAvailableSchemes(storage, getMarketplaceExport(), themeName);
    if (themeData && themeData.schemes && Object.keys(themeData.schemes).length > 0) {
      return themeData;
    }

    // 2. If not found locally, try fetching color.ini from official spicetify-themes repository
    if (fetchFn && themeName && themeName !== "marketplace" && themeName !== "Default") {
      try {
        const res = await fetchFn(`https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${themeName}/color.ini`);
        if (res && res.ok) {
          const text = await res.text();
          const parsedSchemes = parseColorIni(text);
          if (parsedSchemes && Object.keys(parsedSchemes).length > 0) {
            storage.setItem(`spicetify-auto-theme-schemes:${themeName}`, JSON.stringify(parsedSchemes));
            return {
              themeName,
              schemes: parsedSchemes,
              activeScheme: Object.keys(parsedSchemes)[0],
              rawRecordKey: `spicetify-auto-theme-schemes:${themeName}`
            };
          }
        }
      } catch (err) {
        console.debug(`[Auto-Theme] Remote color.ini fetch skipped for ${themeName}:`, err.message);
      }
    }

    return themeData;
  }

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

    // 3. Update marketplace scheme style tag if present to keep styles in sync
    const marketplaceSchemeTag = doc.querySelector("style.marketplaceCSS.marketplaceScheme");
    if (marketplaceSchemeTag) {
      marketplaceSchemeTag.innerHTML = css;
    }

    // 4. Update Spicetify Config
    if (spicetify.Config) {
      spicetify.Config.color_scheme = schemeName;
    }

    // 5. Update Marketplace stored record if applicable
    if (rawRecordKey && rawRecordKey.startsWith("marketplace:")) {
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

  async function evaluateAndApply(overrideIsDark) {
    if (!settings.enabled) return;

    const currentTheme = getCurrentThemeName();
    const themeData = await resolveThemeData(currentTheme);
    const availableNames = themeData?.schemes ? Object.keys(themeData.schemes) : [];

    const isDark = typeof overrideIsDark === "boolean" ? overrideIsDark : Boolean(mediaQuery.matches);
    const target = determineTargetScheme(settings, isDark, availableNames, currentTheme);

    if (target && themeData?.schemes?.[target]) {
      applyScheme(target, themeData.schemes[target], themeData.rawRecordKey);
    }
  }

  // Set up OS appearance change listener
  mediaQuery.addEventListener("change", (e) => {
    console.log(`[Auto-Theme] OS appearance change detected (isDark: ${e?.matches})`);
    evaluateAndApply(e?.matches);
  });

  // Handler to open settings modal
  async function openModalHandler() {
    const currentTheme = getCurrentThemeName();
    const themeData = await resolveThemeData(currentTheme);
    const schemes = themeData?.schemes ? Object.keys(themeData.schemes) : [];

    // Get active theme settings or defaults
    const activeThemeConfig = settings.themeMappings?.[currentTheme] || {
      darkScheme: settings.darkScheme,
      lightScheme: settings.lightScheme
    };

    openSettingsModal({
      themeName: currentTheme,
      schemes,
      currentSettings: {
        enabled: settings.enabled,
        darkScheme: activeThemeConfig.darkScheme,
        lightScheme: activeThemeConfig.lightScheme
      },
      onSave: (newFormValues) => {
        settings.enabled = newFormValues.enabled;
        if (!settings.themeMappings) settings.themeMappings = {};
        settings.themeMappings[currentTheme] = {
          darkScheme: newFormValues.darkScheme,
          lightScheme: newFormValues.lightScheme
        };
        settings.darkScheme = newFormValues.darkScheme;
        settings.lightScheme = newFormValues.lightScheme;

        saveSettings(storage, settings);
        evaluateAndApply();
      }
    });
  }

  // 1. Register Topbar button (Always visible in Spotify top bar)
  if (spicetify.Topbar && spicetify.Topbar.Button) {
    const iconSvg = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13V2a6 6 0 1 1 0 12z"/></svg>';
    try {
      new spicetify.Topbar.Button(
        "Auto Theme Settings",
        iconSvg,
        () => openModalHandler(),
        false,
        false
      );
    } catch (e) {
      console.warn("[Auto-Theme] Topbar button registration error:", e);
    }
  }

  // 2. Register ContextMenuV2 item (matches modern Spotify profile widget)
  if (spicetify.ContextMenuV2 && spicetify.ContextMenuV2.Item) {
    try {
      new spicetify.ContextMenuV2.Item({
        children: "Auto Theme Settings",
        leadingIcon: "brightness",
        onClick: () => openModalHandler(),
        shouldAdd: (props, trigger, target) => {
          if (trigger !== "click" || !target) return false;
          return Boolean(target.closest?.(
            '.main-userWidget-box, .main-userWidget-boxCondensed, [data-testid="user-widget-link"], [data-testid="profile-button"], [data-testid="user-menu-button"], button[aria-haspopup="menu"], .xbwf2n0avSjTCENBLFUM'
          ));
        }
      }).register();
    } catch (e) {
      console.warn("[Auto-Theme] ContextMenuV2 item registration error:", e);
    }
  }

  // 3. Register Spicetify.Menu.Item (for older Spicetify clients)
  if (spicetify.Menu && spicetify.Menu.Item) {
    try {
      const menuItem = new spicetify.Menu.Item("Auto Theme Settings", false, () => openModalHandler());
      if (typeof menuItem.register === "function") {
        menuItem.register();
      }
    } catch (e) {
      console.warn("[Auto-Theme] Menu item registration error:", e);
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
