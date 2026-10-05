// NAME: Spicetify Auto-Theme Switcher
// AUTHOR: mmtechstore
// DESCRIPTION: Automatically switches theme schemes based on Day/Night schedule or OS appearance. Universal across all themes.

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
    mode: "schedule", // "schedule" | "system" | "custom" | "manual"
    scheduleStartHour: 7,
    scheduleEndHour: 19,
    darkScheme: "Base",
    lightScheme: "Orange",
    themeMappings: {}
  };

  const BUILTIN_THEME_CATALOG = {
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

  function isCurrentAppearanceDark({
    mode = "schedule",
    scheduleStartHour = 7,
    scheduleEndHour = 19,
    matchMediaDark = true,
    currentHour = (new Date()).getHours()
  } = {}) {
    if (mode === "system") {
      return Boolean(matchMediaDark);
    }
    if (mode === "schedule" || mode === "custom") {
      const isDaytime = currentHour >= scheduleStartHour && currentHour < scheduleEndHour;
      return !isDaytime;
    }
    if (mode === "manual-light") return false;
    if (mode === "manual-dark") return true;
    return Boolean(matchMediaDark);
  }

  function loadSettings(storage) {
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

  function saveSettings(storage, settings) {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function getMarketplaceThemesFromIDB(idbInstance = (typeof indexedDB !== "undefined" ? indexedDB : null)) {
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

  function generateModalHTML({ themeName, availableThemes = [], schemes = [], settings }) {
    const schemeList = schemes && schemes.length > 0 ? schemes : [];
    const themeList = availableThemes && availableThemes.length > 0
      ? availableThemes
      : [themeName || "StarryNight"];

    const buildSchemeOptions = (selectedVal) => {
      let optionsHtml = "";
      let foundSelected = false;

      for (const s of schemeList) {
        const isSel = s.toLowerCase() === (selectedVal || "").toLowerCase();
        if (isSel) foundSelected = true;
        optionsHtml += `<option value="${s}"${isSel ? " selected" : ""}>${s}</option>\n`;
      }

      if (selectedVal && !foundSelected) {
        optionsHtml += `<option value="${selectedVal}" selected>${selectedVal} (Custom)</option>\n`;
      }

      optionsHtml += `<option value="__custom__">+ Enter Custom Scheme...</option>\n`;
      return optionsHtml;
    };

    const buildThemeOptions = () => {
      return themeList
        .map((t) => {
          const isSel = t.toLowerCase() === (themeName || "").toLowerCase();
          return `<option value="${t}"${isSel ? " selected" : ""}>${t}</option>`;
        })
        .join("\n");
    };

    const isChecked = settings.enabled ? " checked" : "";
    const currentMode = settings.mode || "schedule";
    const startHour = typeof settings.scheduleStartHour === "number" ? settings.scheduleStartHour : 7;
    const endHour = typeof settings.scheduleEndHour === "number" ? settings.scheduleEndHour : 19;

    return `
<div class="auto-theme-modal-container" style="display:flex; flex-direction:column; gap:18px; color:var(--spice-text, #ffffff); font-family:var(--font-family, sans-serif);">
  <div style="border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:12px;">
    <h2 style="font-size:20px; font-weight:700; margin:0 0 4px 0;">Auto Theme Settings</h2>
    <p style="font-size:12px; color:var(--spice-subtext, #a7a7a7); margin:0;">
      Automatically transition between Dark and Light color schemes without restarting Spotify.
    </p>
  </div>

  <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.04); padding:12px 14px; border-radius:8px;">
    <div>
      <div style="font-size:14px; font-weight:600;">Enable Automatic Switching</div>
      <div style="font-size:12px; color:var(--spice-subtext, #a7a7a7);">Switch color schemes automatically</div>
    </div>
    <label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">
      <input type="checkbox" id="auto-theme-enabled" name="auto-theme-enabled"${isChecked} style="opacity:0; width:0; height:0;">
      <span class="auto-theme-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${settings.enabled ? "var(--spice-button, #1db954)" : "rgba(255,255,255,0.2)"}; transition:.3s; border-radius:24px;"></span>
    </label>
  </div>

  <div>
    <label for="auto-theme-mode" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
      Switching Trigger:
    </label>
    <select id="auto-theme-mode" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:6px; background:#282828; color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:13px; outline:none; cursor:pointer;">
      <option value="schedule"${currentMode === "schedule" ? " selected" : ""}>☀️🌙 Day/Night Schedule (Daylight = Light, Night = Dark)</option>
      <option value="system"${currentMode === "system" ? " selected" : ""}>🖥️ OS Appearance (Chromium prefers-color-scheme)</option>
      <option value="custom"${currentMode === "custom" ? " selected" : ""}>⏰ Custom Schedule Hours</option>
      <option value="manual"${currentMode === "manual" ? " selected" : ""}>🖐️ Manual Only (Topbar Toggle Button)</option>
    </select>
  </div>

  <div id="auto-theme-hours-container" style="display:${currentMode === "custom" ? "flex" : "none"}; align-items:center; gap:12px; background:rgba(255,255,255,0.04); padding:10px 14px; border-radius:8px;">
    <div style="font-size:12px; color:var(--spice-subtext, #a7a7a7); flex:1;">Daytime / Light Hours (24h format):</div>
    <div style="display:flex; align-items:center; gap:6px;">
      <input type="number" id="auto-theme-start-hour" min="0" max="23" value="${startHour}" style="width:52px; padding:6px 8px; border-radius:4px; background:#181818; color:#fff; border:1px solid rgba(255,255,255,0.2); text-align:center;">
      <span style="font-size:12px;">to</span>
      <input type="number" id="auto-theme-end-hour" min="0" max="23" value="${endHour}" style="width:52px; padding:6px 8px; border-radius:4px; background:#181818; color:#fff; border:1px solid rgba(255,255,255,0.2); text-align:center;">
    </div>
  </div>

  ${
    themeList.length > 1
      ? `
  <div>
    <label for="auto-theme-theme-select" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
      Active Theme:
    </label>
    <select id="auto-theme-theme-select" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:6px; background:#282828; color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:13px; outline:none; cursor:pointer;">
      ${buildThemeOptions()}
    </select>
  </div>`
      : `<div style="font-size:12px; color:var(--spice-subtext, #a7a7a7);">Theme: <strong style="color:var(--spice-button, #1db954);">${themeName || "StarryNight"}</strong></div>`
  }

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
    <div>
      <label for="auto-theme-dark-scheme" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
        🌙 Dark Mode Scheme:
      </label>
      <select id="auto-theme-dark-scheme" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:6px; background:#282828; color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:13px; outline:none; cursor:pointer;">
        ${buildSchemeOptions(settings.darkScheme || "Base")}
      </select>
      <input type="text" id="auto-theme-dark-custom-input" placeholder="Type custom scheme name" style="display:none; width:100%; box-sizing:border-box; margin-top:6px; padding:8px 12px; border-radius:6px; background:#181818; color:#fff; border:1px solid rgba(255,255,255,0.2); font-size:12px;">
    </div>

    <div>
      <label for="auto-theme-light-scheme" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
        ☀️ Light Mode Scheme:
      </label>
      <select id="auto-theme-light-scheme" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:6px; background:#282828; color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:13px; outline:none; cursor:pointer;">
        ${buildSchemeOptions(settings.lightScheme || "Orange")}
      </select>
      <input type="text" id="auto-theme-light-custom-input" placeholder="Type custom scheme name" style="display:none; width:100%; box-sizing:border-box; margin-top:6px; padding:8px 12px; border-radius:6px; background:#181818; color:#fff; border:1px solid rgba(255,255,255,0.2); font-size:12px;">
    </div>
  </div>

  <div style="display:flex; gap:10px; align-items:center;">
    <button type="button" id="auto-theme-preview-dark-btn" style="flex:1; padding:8px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-size:12px; font-weight:600; transition:.2s;">
      🌙 Preview Dark Now
    </button>
    <button type="button" id="auto-theme-preview-light-btn" style="flex:1; padding:8px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-size:12px; font-weight:600; transition:.2s;">
      ☀️ Preview Light Now
    </button>
  </div>

  <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:6px; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
    <button type="button" id="auto-theme-save-btn" style="padding:10px 24px; border-radius:500px; background:var(--spice-button, #1db954); color:#000; font-weight:700; border:none; cursor:pointer; font-size:14px;">
      Save & Apply
    </button>
  </div>
</div>
`.trim();
  }

  function parseModalFormValues(values) {
    const start = parseInt(values.scheduleStartHour, 10);
    const end = parseInt(values.scheduleEndHour, 10);

    return {
      enabled: Boolean(values.enabled),
      mode: typeof values.mode === "string" && values.mode ? values.mode : "schedule",
      scheduleStartHour: Number.isFinite(start) ? start : 7,
      scheduleEndHour: Number.isFinite(end) ? end : 19,
      darkScheme: typeof values.darkScheme === "string" && values.darkScheme.trim() ? values.darkScheme.trim() : "Base",
      lightScheme: typeof values.lightScheme === "string" && values.lightScheme.trim() ? values.lightScheme.trim() : "Orange"
    };
  }

  function openSettingsModal({
    themeName,
    availableThemes = [],
    schemes = [],
    allThemesSchemesMap = {},
    currentSettings,
    onSave,
    onPreview
  }) {
    if (typeof document === "undefined") return;

    const existing = document.getElementById("spicetify-auto-theme-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "spicetify-auto-theme-modal";
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(6px) !important;
      font-family: var(--font-family, sans-serif) !important;
    `;

    const card = document.createElement("div");
    card.style.cssText = `
      background: var(--spice-player, var(--background-elevated-base, #181818)) !important;
      color: var(--spice-text, #ffffff) !important;
      width: 540px !important;
      max-width: 92vw !important;
      max-height: 88vh !important;
      overflow-y: auto !important;
      border-radius: 12px !important;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      display: flex !important;
      flex-direction: column !important;
      position: relative !important;
      padding: 24px !important;
      box-sizing: border-box !important;
    `;

    card.innerHTML = `
      <div style="display:flex; justify-content:flex-end; margin-bottom:-20px; z-index:1;">
        <button id="auto-theme-close-btn" style="background:transparent; border:none; color:var(--spice-subtext, #a7a7a7); cursor:pointer; font-size:18px; line-height:1; padding:6px; border-radius:50%;">✕</button>
      </div>
      ${generateModalHTML({
        themeName,
        availableThemes,
        schemes,
        settings: currentSettings
      })}
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();
    card.querySelector("#auto-theme-close-btn")?.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", onKeyDown);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const enabledInput = card.querySelector("#auto-theme-enabled");
    const modeSelect = card.querySelector("#auto-theme-mode");
    const hoursContainer = card.querySelector("#auto-theme-hours-container");
    const startHourInput = card.querySelector("#auto-theme-start-hour");
    const endHourInput = card.querySelector("#auto-theme-end-hour");
    const themeSelect = card.querySelector("#auto-theme-theme-select");
    const darkSelect = card.querySelector("#auto-theme-dark-scheme");
    const darkCustomInput = card.querySelector("#auto-theme-dark-custom-input");
    const lightSelect = card.querySelector("#auto-theme-light-scheme");
    const lightCustomInput = card.querySelector("#auto-theme-light-custom-input");
    const previewDarkBtn = card.querySelector("#auto-theme-preview-dark-btn");
    const previewLightBtn = card.querySelector("#auto-theme-preview-light-btn");
    const saveBtn = card.querySelector("#auto-theme-save-btn");
    const slider = card.querySelector(".auto-theme-slider");

    if (enabledInput && slider) {
      enabledInput.addEventListener("change", () => {
        slider.style.backgroundColor = enabledInput.checked
          ? "var(--spice-button, #1db954)"
          : "rgba(255,255,255,0.2)";
      });
    }

    if (modeSelect && hoursContainer) {
      modeSelect.addEventListener("change", () => {
        hoursContainer.style.display = modeSelect.value === "custom" ? "flex" : "none";
      });
    }

    const bindCustomOptionToggle = (selectEl, customInputEl) => {
      if (!selectEl || !customInputEl) return;
      selectEl.addEventListener("change", () => {
        if (selectEl.value === "__custom__") {
          customInputEl.style.display = "block";
          customInputEl.focus();
        } else {
          customInputEl.style.display = "none";
        }
      });
    };
    bindCustomOptionToggle(darkSelect, darkCustomInput);
    bindCustomOptionToggle(lightSelect, lightCustomInput);

    if (themeSelect && allThemesSchemesMap) {
      themeSelect.addEventListener("change", () => {
        const selectedTheme = themeSelect.value;
        const themeSchemes = allThemesSchemesMap[selectedTheme] || [];
        const populate = (selectEl, currentVal) => {
          if (!selectEl) return;
          let opts = "";
          for (const s of themeSchemes) {
            opts += `<option value="${s}"${s === currentVal ? " selected" : ""}>${s}</option>\n`;
          }
          opts += `<option value="__custom__">+ Enter Custom Scheme...</option>\n`;
          selectEl.innerHTML = opts;
        };
        populate(darkSelect, currentSettings.darkScheme);
        populate(lightSelect, currentSettings.lightScheme);
      });
    }

    const getEffectiveScheme = (selectEl, customInputEl, fallback) => {
      if (!selectEl) return fallback;
      if (selectEl.value === "__custom__" && customInputEl && customInputEl.value.trim()) {
        return customInputEl.value.trim();
      }
      return selectEl.value || fallback;
    };

    if (previewDarkBtn && typeof onPreview === "function") {
      previewDarkBtn.addEventListener("click", () => {
        const scheme = getEffectiveScheme(darkSelect, darkCustomInput, "Base");
        onPreview(true, scheme);
      });
    }
    if (previewLightBtn && typeof onPreview === "function") {
      previewLightBtn.addEventListener("click", () => {
        const scheme = getEffectiveScheme(lightSelect, lightCustomInput, "Orange");
        onPreview(false, scheme);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const darkScheme = getEffectiveScheme(darkSelect, darkCustomInput, currentSettings.darkScheme);
        const lightScheme = getEffectiveScheme(lightSelect, lightCustomInput, currentSettings.lightScheme);
        const chosenTheme = themeSelect ? themeSelect.value : themeName;

        const newSettings = parseModalFormValues({
          enabled: enabledInput ? enabledInput.checked : currentSettings.enabled,
          mode: modeSelect ? modeSelect.value : currentSettings.mode,
          scheduleStartHour: startHourInput ? startHourInput.value : currentSettings.scheduleStartHour,
          scheduleEndHour: endHourInput ? endHourInput.value : currentSettings.scheduleEndHour,
          darkScheme,
          lightScheme
        });

        if (typeof onSave === "function") {
          onSave(newSettings, chosenTheme);
        }

        closeModal();
        if (typeof Spicetify !== "undefined" && Spicetify.showNotification) {
          Spicetify.showNotification(`Auto Theme: Settings saved for ${chosenTheme || "theme"}`);
        }
      });
    }
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

    let idbThemes = {};
    let currentlyAppliedDark = null;

    function getCurrentThemeName() {
      const raw = Spicetify.Config?.current_theme;
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
        if (window.Marketplace && typeof window.Marketplace.export === "function") {
          return window.Marketplace.export();
        }
      } catch {}
      return null;
    }

    async function fetchRemoteSchemes(themeName) {
      if (!themeName || themeName === "marketplace" || themeName === "Default") return null;
      try {
        const res = await fetch(`https://raw.githubusercontent.com/spicetify/spicetify-themes/master/${themeName}/color.ini`);
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

    function evaluateAndApply(overrideIsDark) {
      if (!settings.enabled && typeof overrideIsDark !== "boolean") return;

      const currentTheme = getCurrentThemeName();
      let themeData = resolveThemeData(currentTheme);

      const availableNames = themeData?.schemes ? Object.keys(themeData.schemes) : [];

      const isDark = typeof overrideIsDark === "boolean"
        ? overrideIsDark
        : isCurrentAppearanceDark({
            mode: settings.mode,
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

    // Periodic time check for schedule auto-switching
    const scheduleInterval = typeof setInterval !== "undefined"
      ? setInterval(() => {
          if (settings.enabled && (settings.mode === "schedule" || settings.mode === "custom")) {
            evaluateAndApply();
          }
        }, 30000)
      : null;
    if (scheduleInterval && typeof scheduleInterval.unref === "function") {
      scheduleInterval.unref();
    }

    // OS appearance change listener
    mediaQuery.addEventListener("change", (e) => {
      console.log(`[Auto-Theme] OS appearance change detected (isDark: ${e?.matches})`);
      if (settings.mode === "system") {
        evaluateAndApply(e?.matches);
      }
    });

    // Query IndexedDB for installed marketplace themes
    getMarketplaceThemesFromIDB().then((themes) => {
      if (themes && Object.keys(themes).length > 0) {
        idbThemes = themes;
        evaluateAndApply();
      }
    }).catch(() => {});

    // Quick toggle helper
    function quickToggle() {
      const nextIsDark = !currentlyAppliedDark;
      evaluateAndApply(nextIsDark);
      const currentTheme = getCurrentThemeName();
      const themeConfig = settings.themeMappings?.[currentTheme] || settings;
      const scheme = nextIsDark ? themeConfig.darkScheme : themeConfig.lightScheme;
      if (Spicetify.showNotification) {
        Spicetify.showNotification(`Auto Theme: Switched to ${nextIsDark ? "🌙 Dark" : "☀️ Light"} (${scheme})`);
      }
    }

    // Modal opener handler
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
        if (Spicetify.showNotification) {
          Spicetify.showNotification("Auto Theme error: " + err.message, true);
        }
      }
    }

    // 1. Topbar Button (Settings)
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

    // 2. Topbar Quick-Toggle Button (☀️ / 🌙 Instant Toggle)
    if (Spicetify.Topbar && Spicetify.Topbar.Button) {
      const toggleIconSvg = '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8z"/></svg>';
      try {
        new Spicetify.Topbar.Button(
          "Toggle Dark/Light Mode",
          toggleIconSvg,
          () => quickToggle(),
          false,
          false
        );
      } catch (e) {
        console.warn("[Auto-Theme] Topbar toggle button registration error:", e);
      }
    }

    // 3. ContextMenuV2 item
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

    // 4. Spicetify.Menu.Item
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

    // Initial evaluation
    evaluateAndApply();
    console.log("[Auto-Theme] Extension successfully loaded and active.");
  }

  initAutoTheme();
})();
