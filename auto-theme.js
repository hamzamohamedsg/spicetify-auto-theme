// NAME: Spicetify Auto-Theme Switcher
// AUTHOR: mmtechstore
// DESCRIPTION: Automatically switches theme schemes based on system Dark/Light appearance. Universal across all themes.

(function autoThemeIIFE() {
  "use strict";

  // ==========================================
  // 1. Color Utilities & Style Generator
  // ==========================================

  function hexToRGB(hex) {
    if (!hex || typeof hex !== "string") return "0,0,0";
    let clean = hex.trim().replace(/^#/, "");
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    } else if (clean.length === 8) {
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

  function generateSchemeCSS(schemeColors, targetSelector = ":root") {
    if (!schemeColors || typeof schemeColors !== "object") return "";
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

  function parseColorIni(iniText) {
    if (!iniText || typeof iniText !== "string") return {};
    const lines = iniText.split(/\r?\n/);
    const sections = {};
    let currentSection = null;

    for (const rawLine of lines) {
      const line = rawLine.replace(/[;#].*$/, "").trim();
      if (!line) continue;

      const sectionMatch = line.match(/^\[(.*)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].trim();
        sections[currentSection] = {};
        continue;
      }

      if (currentSection && line.includes("=")) {
        const [key, ...valParts] = line.split("=");
        const cleanKey = key.trim();
        const cleanVal = valParts.join("=").trim().replace(/^#/, "");
        if (cleanKey && cleanVal) {
          sections[currentSection][cleanKey] = cleanVal;
        }
      }
    }
    return sections;
  }

  // ==========================================
  // 2. Storage & Theme Resolution
  // ==========================================

  const SETTINGS_KEY = "spicetify-auto-theme:settings";
  const MARKETPLACE_THEME_KEY = "marketplace:theme-installed";

  const DEFAULT_SETTINGS = {
    enabled: true,
    darkScheme: "Base",
    lightScheme: "Orange",
    themeMappings: {}
  };

  function loadSettings(storage) {
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

  function saveSettings(storage, settings) {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function getAvailableSchemes(storage, marketplaceExport, currentTheme) {
    try {
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

  function determineTargetScheme(settings, isDark, availableSchemes = [], currentTheme = null) {
    if (!settings || !settings.enabled) return null;

    let themeConfig = null;
    if (currentTheme && settings.themeMappings && settings.themeMappings[currentTheme]) {
      themeConfig = settings.themeMappings[currentTheme];
    }

    const desired = themeConfig
      ? (isDark ? themeConfig.darkScheme : themeConfig.lightScheme)
      : (isDark ? settings.darkScheme : settings.lightScheme);

    if (!desired) return null;

    if (!availableSchemes || availableSchemes.length === 0) {
      return desired;
    }

    if (availableSchemes.includes(desired)) {
      return desired;
    }

    if (isDark) {
      const darkFallback = availableSchemes.find((s) => /base|dark|night|mocha|frappe|macchiato|black/i.test(s));
      return darkFallback || availableSchemes[0] || null;
    } else {
      const lightFallback = availableSchemes.find((s) => /orange|light|latte|day|white/i.test(s));
      return lightFallback || availableSchemes[1] || availableSchemes[0] || null;
    }
  }

  // ==========================================
  // 3. Settings UI Modal
  // ==========================================

  function generateModalHTML({ themeName, schemes, settings }) {
    const schemeList = schemes && schemes.length > 0 ? schemes : [];
    const buildDatalistOptions = () => {
      return schemeList.map((s) => `<option value="${s}">`).join("\n");
    };

    const isChecked = settings.enabled ? " checked" : "";

    return `
<div class="auto-theme-modal-container" style="display:flex; flex-direction:column; gap:20px; padding:10px 0; color:var(--spice-text, #ffffff); font-family:var(--font-family, sans-serif);">
  <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
    <h2 style="font-size:22px; font-weight:700; margin:0 0 6px 0;">Auto Theme Settings</h2>
    <p style="font-size:13px; color:var(--spice-subtext, #a7a7a7); margin:0;">
      Automatically synchronize Spotify's colors with your system Dark / Light mode.
    </p>
    <div style="margin-top:8px; font-size:13px; opacity:0.9;">
      Active Theme: <strong style="color:var(--spice-button, #1db954);">${themeName || "Default"}</strong>
    </div>
  </div>

  <div style="display:flex; align-items:center; justify-content:space-between;">
    <div>
      <div style="font-size:14px; font-weight:600;">Enable Automatic Switching</div>
      <div style="font-size:12px; color:var(--spice-subtext, #a7a7a7);">Switch color schemes when your laptop changes appearance</div>
    </div>
    <label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">
      <input type="checkbox" id="auto-theme-enabled" name="auto-theme-enabled"${isChecked} style="opacity:0; width:0; height:0;">
      <span class="auto-theme-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${settings.enabled ? "var(--spice-button, #1db954)" : "rgba(255,255,255,0.2)"}; transition:.3s; border-radius:24px;"></span>
    </label>
  </div>

  <div style="display:flex; flex-direction:column; gap:16px;">
    <div>
      <label for="auto-theme-dark-scheme" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
        Dark Mode Color Scheme:
      </label>
      <input list="auto-theme-dark-list" id="auto-theme-dark-scheme" value="${settings.darkScheme || ""}" placeholder="Select or type scheme name (e.g. Base, Dark, Mocha)" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:14px; outline:none;">
      <datalist id="auto-theme-dark-list">
        ${buildDatalistOptions()}
      </datalist>
    </div>

    <div>
      <label for="auto-theme-light-scheme" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
        Light Mode Color Scheme:
      </label>
      <input list="auto-theme-light-list" id="auto-theme-light-scheme" value="${settings.lightScheme || ""}" placeholder="Select or type scheme name (e.g. Orange, Light, Latte)" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:14px; outline:none;">
      <datalist id="auto-theme-light-list">
        ${buildDatalistOptions()}
      </datalist>
    </div>
  </div>

  <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
    <button id="auto-theme-save-btn" style="padding:10px 22px; border-radius:500px; background:var(--spice-button, #1db954); color:#000; font-weight:700; border:none; cursor:pointer; font-size:14px;">
      Save & Apply
    </button>
  </div>
</div>
`.trim();
  }

  function parseModalFormValues(values) {
    return {
      enabled: Boolean(values.enabled),
      darkScheme: typeof values.darkScheme === "string" && values.darkScheme.trim() ? values.darkScheme.trim() : "Base",
      lightScheme: typeof values.lightScheme === "string" && values.lightScheme.trim() ? values.lightScheme.trim() : "Orange"
    };
  }

  function openSettingsModal({ themeName, schemes, currentSettings, onSave }) {
    if (typeof Spicetify === "undefined" || !Spicetify.PopupModal) return;

    const container = document.createElement("div");
    container.innerHTML = generateModalHTML({
      themeName,
      schemes,
      settings: currentSettings
    });

    const enabledInput = container.querySelector("#auto-theme-enabled");
    const darkInput = container.querySelector("#auto-theme-dark-scheme");
    const lightInput = container.querySelector("#auto-theme-light-scheme");
    const saveBtn = container.querySelector("#auto-theme-save-btn");
    const slider = container.querySelector(".auto-theme-slider");

    if (enabledInput && slider) {
      enabledInput.addEventListener("change", () => {
        slider.style.backgroundColor = enabledInput.checked
          ? "var(--spice-button, #1db954)"
          : "rgba(255,255,255,0.2)";
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const newSettings = parseModalFormValues({
          enabled: enabledInput ? enabledInput.checked : currentSettings.enabled,
          darkScheme: darkInput ? darkInput.value : currentSettings.darkScheme,
          lightScheme: lightInput ? lightInput.value : currentSettings.lightScheme
        });

        if (typeof onSave === "function") {
          onSave(newSettings);
        }

        Spicetify.PopupModal.hide();
        if (Spicetify.showNotification) {
          Spicetify.showNotification(`Auto Theme: Settings saved for ${themeName || "theme"}`);
        }
      });
    }

    Spicetify.PopupModal.display({
      title: "Spicetify Auto-Theme",
      content: container,
      isLarge: false
    });
  }

  // ==========================================
  // 4. Main Extension Initialization
  // ==========================================

  function initAutoTheme() {
    if (typeof Spicetify === "undefined" || !Spicetify.Config) {
      setTimeout(initAutoTheme, 250);
      return;
    }

    const doc = document;
    const mm = window.matchMedia ? window.matchMedia.bind(window) : null;
    if (!mm) {
      console.warn("[Auto-Theme] matchMedia is not supported");
      return;
    }

    const storage = {
      getItem: (key) => {
        try {
          if (Spicetify.LocalStorage) {
            const v = Spicetify.LocalStorage.get(key);
            if (v !== null && v !== undefined) return v;
          }
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key, val) => {
        try {
          if (Spicetify.LocalStorage) Spicetify.LocalStorage.set(key, val);
          localStorage.setItem(key, val);
        } catch (e) {
          console.warn("[Auto-Theme] Storage save error", e);
        }
      }
    };

    let settings = loadSettings(storage);
    const mediaQuery = mm("(prefers-color-scheme: dark)");

    function getCurrentThemeName() {
      return Spicetify.Config?.current_theme || "Default";
    }

    function getMarketplaceExport() {
      try {
        if (window.Marketplace && typeof window.Marketplace.export === "function") {
          return window.Marketplace.export();
        }
      } catch {}
      return null;
    }

    async function resolveThemeData(themeName) {
      let themeData = getAvailableSchemes(storage, getMarketplaceExport(), themeName);
      if (themeData && themeData.schemes && Object.keys(themeData.schemes).length > 0) {
        return themeData;
      }

      if (themeName && themeName !== "marketplace" && themeName !== "Default") {
        try {
          const res = await fetch(`https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${themeName}/color.ini`);
          if (res && res.ok) {
            const text = await res.text();
            const parsed = parseColorIni(text);
            if (parsed && Object.keys(parsed).length > 0) {
              storage.setItem(`spicetify-auto-theme-schemes:${themeName}`, JSON.stringify(parsed));
              return {
                themeName,
                schemes: parsed,
                activeScheme: Object.keys(parsed)[0],
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

      const css = generateSchemeCSS(schemeColors, ":root");

      let styleTag = doc.querySelector("style#spicetify-auto-theme");
      if (!styleTag) {
        styleTag = doc.createElement("style");
        styleTag.id = "spicetify-auto-theme";
        doc.head.appendChild(styleTag);
      }
      styleTag.innerHTML = css;

      const marketplaceSchemeTag = doc.querySelector("style.marketplaceCSS.marketplaceScheme");
      if (marketplaceSchemeTag) {
        marketplaceSchemeTag.innerHTML = css;
      }

      if (Spicetify.Config) {
        Spicetify.Config.color_scheme = schemeName;
      }

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

    mediaQuery.addEventListener("change", (e) => {
      console.log(`[Auto-Theme] OS appearance change detected (isDark: ${e?.matches})`);
      evaluateAndApply(e?.matches);
    });

    async function openModalHandler() {
      const currentTheme = getCurrentThemeName();
      const themeData = await resolveThemeData(currentTheme);
      const schemes = themeData?.schemes ? Object.keys(themeData.schemes) : [];

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

    // 1. Topbar Button (Always visible on Spotify top navigation bar!)
    if (Spicetify.Topbar && Spicetify.Topbar.Button) {
      const iconSvg = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13V2a6 6 0 1 1 0 12z"/></svg>';
      try {
        new Spicetify.Topbar.Button(
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

    // 2. ContextMenuV2 item (Matches modern Spotify profile widget)
    if (Spicetify.ContextMenuV2 && Spicetify.ContextMenuV2.Item) {
      try {
        new Spicetify.ContextMenuV2.Item({
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

    // 3. Spicetify.Menu.Item (for older Spicetify clients)
    if (Spicetify.Menu && Spicetify.Menu.Item) {
      try {
        const menuItem = new Spicetify.Menu.Item("Auto Theme Settings", false, () => openModalHandler());
        if (typeof menuItem.register === "function") {
          menuItem.register();
        }
      } catch (e) {
        console.warn("[Auto-Theme] Menu item registration error:", e);
      }
    }

    evaluateAndApply();
    console.log("[Auto-Theme] Extension successfully loaded and active.");
  }

  initAutoTheme();
})();
