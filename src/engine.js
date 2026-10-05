import { generateSchemeCSS, parseColorIni } from "./utils.js";
import {
  loadSettings,
  saveSettings,
  getAvailableSchemes,
  determineTargetScheme,
  isCurrentAppearanceDark,
  fetchOSAppearance,
  getMarketplaceThemesFromIDB,
  BUILTIN_THEME_CATALOG
} from "./themeManager.js";
import { openSettingsModal } from "./settingsModal.js";

/**
 * Initializes the universal auto-theme engine with dependency injection for testing.
 *
 * @param {{
 *   document?: Document,
 *   matchMedia?: (query: string) => MediaQueryList,
 *   spicetify?: typeof Spicetify,
 *   fetch?: typeof fetch,
 *   indexedDB?: IDBFactory
 * }} env
 */
export function initAutoTheme(env = {}) {
  const doc = env.document || (typeof document !== "undefined" ? document : null);
  const mm = env.matchMedia || (typeof window !== "undefined" && window.matchMedia ? window.matchMedia.bind(window) : null);
  const spicetify = env.spicetify || (typeof Spicetify !== "undefined" ? Spicetify : null);
  const fetchFn = env.fetch || (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);
  const idb = env.indexedDB || (typeof indexedDB !== "undefined" ? indexedDB : null);

  if (!doc || !mm || !spicetify) {
    console.warn("[Auto-Theme] Required environment APIs not available");
    return null;
  }

  // Storage interface adapter
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

  // State cache for installed themes & OS appearance
  let idbThemes = {};
  let currentlyAppliedDark = null;
  let cachedOSAppearance = null;

  function getCurrentThemeName() {
    const raw = spicetify.Config?.current_theme;
    if (raw && raw !== "marketplace" && raw !== "Default") {
      return raw;
    }
    const idbNames = Object.keys(idbThemes);
    if (idbNames.length > 0) {
      return idbNames[0];
    }
    return "StarryNight";
  }

  function getMarketplaceExport() {
    try {
      if (typeof window !== "undefined" && window.Marketplace && typeof window.Marketplace.export === "function") {
        return window.Marketplace.export();
      }
    } catch {}
    return null;
  }

  async function fetchRemoteSchemes(themeName) {
    if (!fetchFn || !themeName || themeName === "marketplace" || themeName === "Default") return null;
    try {
      const res = await fetchFn(`https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${themeName}/color.ini`);
      if (res && res.ok) {
        const text = await res.text();
        const parsed = parseColorIni(text);
        if (parsed && Object.keys(parsed).length > 0) {
          storage.setItem(`spicetify-auto-theme-schemes:${themeName}`, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch (err) {
      console.debug(`[Auto-Theme] Remote color.ini fetch skipped for ${themeName}:`, err.message);
    }
    return null;
  }

  function resolveThemeData(themeName) {
    if (idbThemes[themeName]) {
      return idbThemes[themeName];
    }
    const fromStorage = getAvailableSchemes(storage, getMarketplaceExport(), themeName);
    if (fromStorage) return fromStorage;

    if (BUILTIN_THEME_CATALOG[themeName]) {
      return {
        themeName,
        schemes: BUILTIN_THEME_CATALOG[themeName],
        activeScheme: Object.keys(BUILTIN_THEME_CATALOG[themeName])[0] || "",
        rawRecordKey: `builtin:${themeName}`
      };
    }
    return null;
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

  function evaluateAndApply(overrideIsDark) {
    if (!settings.enabled && typeof overrideIsDark !== "boolean") return;

    const currentTheme = getCurrentThemeName();
    let themeData = resolveThemeData(currentTheme);

    const availableNames = themeData?.schemes ? Object.keys(themeData.schemes) : [];

    const isDark = typeof overrideIsDark === "boolean"
      ? overrideIsDark
      : isCurrentAppearanceDark({
          mode: settings.mode,
          osAppearanceDark: cachedOSAppearance,
          scheduleStartHour: settings.scheduleStartHour,
          scheduleEndHour: settings.scheduleEndHour,
          matchMediaDark: Boolean(mediaQuery.matches)
        });

    currentlyAppliedDark = isDark;
    const target = determineTargetScheme(settings, isDark, availableNames, currentTheme);

    if (target && themeData?.schemes?.[target]) {
      applyScheme(target, themeData.schemes[target], themeData.rawRecordKey);
    } else if (availableNames.length === 0 && currentTheme) {
      fetchRemoteSchemes(currentTheme).then((fetched) => {
        if (fetched && target && fetched[target]) {
          applyScheme(target, fetched[target], `spicetify-auto-theme-schemes:${currentTheme}`);
        }
      });
    }
  }

  async function checkOSAppearance() {
    if (fetchFn) {
      const detected = await fetchOSAppearance(fetchFn);
      if (typeof detected === "boolean" && detected !== cachedOSAppearance) {
        cachedOSAppearance = detected;
        if (settings.mode === "system") {
          evaluateAndApply();
        }
      }
    }
  }

  // Periodic appearance check
  const appearanceCheckInterval = typeof setInterval !== "undefined"
    ? setInterval(() => {
        if (settings.enabled) {
          if (settings.mode === "system") {
            checkOSAppearance();
          } else if (settings.mode === "schedule" || settings.mode === "custom") {
            evaluateAndApply();
          }
        }
      }, 3000)
    : null;
  if (appearanceCheckInterval && typeof appearanceCheckInterval.unref === "function") {
    appearanceCheckInterval.unref();
  }

  // Check appearance immediately on window focus
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("focus", () => {
      if (settings.enabled && settings.mode === "system") {
        checkOSAppearance();
      }
    });
  }

  // OS appearance media query listener (for Linux/Windows/CEF builds that support it)
  mediaQuery.addEventListener("change", (e) => {
    console.log(`[Auto-Theme] OS appearance change detected (isDark: ${e?.matches})`);
    if (settings.mode === "system") {
      evaluateAndApply(e?.matches);
    }
  });

  // Query IndexedDB for installed marketplace themes
  if (idb) {
    getMarketplaceThemesFromIDB(idb).then((themes) => {
      if (themes && Object.keys(themes).length > 0) {
        idbThemes = themes;
        evaluateAndApply();
      }
    }).catch(() => {});
  }

  // Quick toggle helper
  function quickToggle() {
    const nextIsDark = !currentlyAppliedDark;
    evaluateAndApply(nextIsDark);
    const currentTheme = getCurrentThemeName();
    const themeConfig = settings.themeMappings?.[currentTheme] || settings;
    const scheme = nextIsDark ? themeConfig.darkScheme : themeConfig.lightScheme;
    if (spicetify.showNotification) {
      spicetify.showNotification(`Auto Theme: Switched to ${nextIsDark ? "🌙 Dark" : "☀️ Light"} (${scheme})`);
    }
  }

  // Synchronous, instant click handler to open settings modal
  function openModalHandler() {
    try {
      const currentTheme = getCurrentThemeName();
      const themeData = resolveThemeData(currentTheme);
      const schemes = themeData?.schemes ? Object.keys(themeData.schemes) : [];

      const availableThemes = Array.from(new Set([
        ...Object.keys(idbThemes),
        ...Object.keys(BUILTIN_THEME_CATALOG)
      ]));

      const allThemesSchemesMap = {};
      for (const t of availableThemes) {
        if (idbThemes[t]?.schemes) {
          allThemesSchemesMap[t] = Object.keys(idbThemes[t].schemes);
        } else if (BUILTIN_THEME_CATALOG[t]) {
          allThemesSchemesMap[t] = Object.keys(BUILTIN_THEME_CATALOG[t]);
        }
      }

      const activeThemeConfig = settings.themeMappings?.[currentTheme] || {
        darkScheme: settings.darkScheme,
        lightScheme: settings.lightScheme
      };

      openSettingsModal({
        themeName: currentTheme,
        availableThemes,
        schemes,
        allThemesSchemesMap,
        currentSettings: {
          enabled: settings.enabled,
          mode: settings.mode,
          scheduleStartHour: settings.scheduleStartHour,
          scheduleEndHour: settings.scheduleEndHour,
          darkScheme: activeThemeConfig.darkScheme,
          lightScheme: activeThemeConfig.lightScheme
        },
        onSave: (newFormValues, chosenTheme) => {
          settings.enabled = newFormValues.enabled;
          settings.mode = newFormValues.mode;
          settings.scheduleStartHour = newFormValues.scheduleStartHour;
          settings.scheduleEndHour = newFormValues.scheduleEndHour;

          const targetTheme = chosenTheme || currentTheme;
          if (!settings.themeMappings) settings.themeMappings = {};
          settings.themeMappings[targetTheme] = {
            darkScheme: newFormValues.darkScheme,
            lightScheme: newFormValues.lightScheme
          };
          settings.darkScheme = newFormValues.darkScheme;
          settings.lightScheme = newFormValues.lightScheme;

          saveSettings(storage, settings);
          evaluateAndApply();
        },
        onPreview: (previewDark, schemeName) => {
          const tData = resolveThemeData(currentTheme);
          if (tData?.schemes?.[schemeName]) {
            applyScheme(schemeName, tData.schemes[schemeName], tData.rawRecordKey);
          } else if (BUILTIN_THEME_CATALOG[currentTheme]?.[schemeName]) {
            applyScheme(schemeName, BUILTIN_THEME_CATALOG[currentTheme][schemeName], `builtin:${currentTheme}`);
          }
        }
      });
    } catch (err) {
      console.error("[Auto-Theme] Error opening modal:", err);
      if (spicetify.showNotification) {
        spicetify.showNotification("Auto Theme error: " + err.message, true);
      }
    }
  }

  // 1. Topbar Button (Settings)
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

  // 2. ContextMenuV2 item
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

  // 3. Spicetify.Menu.Item
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

  // Initial evaluation with OS check
  checkOSAppearance().then(() => evaluateAndApply()).catch(() => evaluateAndApply());

  return {
    getSettings: () => settings,
    evaluateAndApply,
    quickToggle,
    openModalHandler,
    destroy: () => {
      if (appearanceCheckInterval) clearInterval(appearanceCheckInterval);
    },
    updateSettings: (newSettings) => {
      settings = newSettings;
      saveSettings(storage, settings);
      evaluateAndApply();
    }
  };
}
