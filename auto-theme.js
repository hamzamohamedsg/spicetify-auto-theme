// NAME: Spicetify Auto-Theme
// AUTHOR: mmtechstore
// DESCRIPTION: Automatically switches between Dark and Light color schemes based on macOS appearance.

(function AutoThemeExtension() {
  // Wait for Spicetify APIs to be fully ready
  if (
    typeof Spicetify === "undefined" ||
    !Spicetify.LocalStorage ||
    !Spicetify.Menu ||
    !document.body
  ) {
    setTimeout(AutoThemeExtension, 200);
    return;
  }

  console.log("[Auto-Theme] Initializing extension...");

  // --- Constants & Storage ---
  const SETTINGS_KEY = "spicetify-auto-theme:settings";
  const MARKETPLACE_THEME_KEY = "marketplace:theme-installed";

  const DEFAULT_SETTINGS = {
    enabled: true,
    darkScheme: "Base",
    lightScheme: "Orange"
  };

  const storage = {
    getItem: (key) => {
      try {
        return Spicetify.LocalStorage.get(key);
      } catch {
        return null;
      }
    },
    setItem: (key, val) => {
      try {
        Spicetify.LocalStorage.set(key, val);
      } catch (e) {
        console.warn("[Auto-Theme] Storage save error", e);
      }
    }
  };

  function loadSettings() {
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

  function saveSettings(settings) {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // --- Color Utilities ---
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

  function generateSchemeCSS(schemeColors) {
    if (!schemeColors || typeof schemeColors !== "object") return "";
    const lines = [":root {"];
    for (const [key, rawValue] of Object.entries(schemeColors)) {
      if (!rawValue) continue;
      const cleanHex = rawValue.trim().replace(/^#/, "");
      lines.push(`  --spice-${key}: #${cleanHex};`);
      lines.push(`  --spice-rgb-${key}: ${hexToRGB(cleanHex)};`);
    }
    lines.push("}");
    return lines.join("\n");
  }

  // --- Theme Resolution ---
  function getAvailableSchemes() {
    try {
      const themeKey = storage.getItem(MARKETPLACE_THEME_KEY);
      if (!themeKey) return null;

      const rawData = storage.getItem(themeKey);
      if (!rawData) return null;

      const record = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
      if (!record || typeof record !== "object") return null;

      const schemes = record.schemes || {};
      const themeName = record.manifest?.name || record.title || "Installed Theme";
      const activeScheme = record.activeScheme || Object.keys(schemes)[0] || "";

      return {
        themeName,
        schemes,
        activeScheme,
        rawRecordKey: themeKey
      };
    } catch (err) {
      console.warn("[Auto-Theme] Failed to read theme record", err);
      return null;
    }
  }

  function determineTargetScheme(settings, isDark, availableSchemes) {
    if (!settings || !settings.enabled) return null;

    const desired = isDark ? settings.darkScheme : settings.lightScheme;
    if (availableSchemes.includes(desired)) {
      return desired;
    }

    if (isDark) {
      const darkFallback = availableSchemes.find((s) => /base|dark|night|mocha|frappe|macchiato/i.test(s));
      return darkFallback || availableSchemes[0] || null;
    } else {
      const lightFallback = availableSchemes.find((s) => /orange|light|latte|day|white/i.test(s));
      return lightFallback || availableSchemes[1] || availableSchemes[0] || null;
    }
  }

  // --- Style Injection ---
  function applyScheme(schemeName, schemeColors, rawRecordKey) {
    if (!schemeColors || typeof schemeColors !== "object") return;

    const css = generateSchemeCSS(schemeColors);

    // Update custom auto-theme style tag
    let styleTag = document.querySelector("style#spicetify-auto-theme");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "spicetify-auto-theme";
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = css;

    // Update marketplace style tag to keep everything coherent
    const marketplaceSchemeTag = document.querySelector("style.marketplaceCSS.marketplaceScheme");
    if (marketplaceSchemeTag) {
      marketplaceSchemeTag.innerHTML = css;
    }

    // Sync Spicetify Config
    if (Spicetify.Config) {
      Spicetify.Config.color_scheme = schemeName;
    }

    // Sync Marketplace LocalStorage record
    if (rawRecordKey) {
      try {
        const raw = storage.getItem(rawRecordKey);
        if (raw) {
          const record = typeof raw === "string" ? JSON.parse(raw) : raw;
          record.activeScheme = schemeName;
          storage.setItem(rawRecordKey, JSON.stringify(record));
        }
      } catch (err) {
        console.warn("[Auto-Theme] Error syncing marketplace storage", err);
      }
    }

    console.log(`[Auto-Theme] Switched color scheme to: ${schemeName}`);
  }

  let currentSettings = loadSettings();
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function evaluateAndApply(overrideIsDark) {
    if (!currentSettings.enabled) return;

    const themeData = getAvailableSchemes();
    if (!themeData || !themeData.schemes) {
      console.debug("[Auto-Theme] No schemes found in marketplace storage");
      return;
    }

    const availableNames = Object.keys(themeData.schemes);
    if (availableNames.length === 0) return;

    const isDark = typeof overrideIsDark === "boolean" ? overrideIsDark : Boolean(mediaQuery.matches);
    const target = determineTargetScheme(currentSettings, isDark, availableNames);

    if (target && themeData.schemes[target]) {
      applyScheme(target, themeData.schemes[target], themeData.rawRecordKey);
    }
  }

  // --- OS Appearance Change Listener ---
  mediaQuery.addEventListener("change", (e) => {
    console.log(`[Auto-Theme] OS appearance change detected (isDark: ${e?.matches})`);
    evaluateAndApply(e?.matches);
  });

  // --- Settings Modal ---
  function openSettingsModal() {
    if (!Spicetify.PopupModal) {
      console.warn("[Auto-Theme] Spicetify.PopupModal is not available");
      return;
    }

    const themeData = getAvailableSchemes();
    const schemes = themeData ? Object.keys(themeData.schemes) : ["Base", "Orange"];
    const themeName = themeData ? themeData.themeName : "Installed Theme";

    const buildOptions = (selected) => {
      return schemes
        .map((s) => `<option value="${s}"${s === selected ? " selected" : ""}>${s}</option>`)
        .join("\n");
    };

    const isChecked = currentSettings.enabled ? " checked" : "";

    const container = document.createElement("div");
    container.innerHTML = `
<div class="auto-theme-modal-container" style="display:flex; flex-direction:column; gap:20px; padding:10px 0; color:var(--spice-text, #ffffff); font-family:var(--font-family, sans-serif);">
  <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
    <h2 style="font-size:22px; font-weight:700; margin:0 0 6px 0;">Auto Theme Settings</h2>
    <p style="font-size:13px; color:var(--spice-subtext, #a7a7a7); margin:0;">
      Automatically synchronize Spotify's appearance with your macOS Dark / Light mode.
    </p>
    <div style="margin-top:8px; font-size:12px; opacity:0.8;">
      Active Theme: <strong style="color:var(--spice-button, #1db954);">${themeName}</strong>
    </div>
  </div>

  <div style="display:flex; align-items:center; justify-content:space-between;">
    <div>
      <div style="font-size:14px; font-weight:600;">Enable Automatic Switching</div>
      <div style="font-size:12px; color:var(--spice-subtext, #a7a7a7);">Switch color schemes when your laptop changes appearance</div>
    </div>
    <label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">
      <input type="checkbox" id="auto-theme-enabled" name="auto-theme-enabled"${isChecked} style="opacity:0; width:0; height:0;">
      <span class="auto-theme-slider" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${currentSettings.enabled ? "var(--spice-button, #1db954)" : "rgba(255,255,255,0.2)"}; transition:.3s; border-radius:24px;"></span>
    </label>
  </div>

  <div style="display:flex; flex-direction:column; gap:16px;">
    <div>
      <label for="auto-theme-dark-scheme" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
        Dark Mode Color Scheme:
      </label>
      <select id="auto-theme-dark-scheme" style="width:100%; padding:10px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:14px; outline:none; cursor:pointer;">
        ${buildOptions(currentSettings.darkScheme)}
      </select>
    </div>

    <div>
      <label for="auto-theme-light-scheme" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
        Light Mode Color Scheme:
      </label>
      <select id="auto-theme-light-scheme" style="width:100%; padding:10px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.2); font-size:14px; outline:none; cursor:pointer;">
        ${buildOptions(currentSettings.lightScheme)}
      </select>
    </div>
  </div>

  <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
    <button id="auto-theme-save-btn" style="padding:10px 22px; border-radius:500px; background:var(--spice-button, #1db954); color:#000; font-weight:700; border:none; cursor:pointer; font-size:14px;">
      Save Changes
    </button>
  </div>
</div>
`.trim();

    const enabledInput = container.querySelector("#auto-theme-enabled");
    const darkSelect = container.querySelector("#auto-theme-dark-scheme");
    const lightSelect = container.querySelector("#auto-theme-light-scheme");
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
        currentSettings = {
          enabled: enabledInput ? enabledInput.checked : currentSettings.enabled,
          darkScheme: darkSelect ? darkSelect.value : currentSettings.darkScheme,
          lightScheme: lightSelect ? lightSelect.value : currentSettings.lightScheme
        };

        saveSettings(currentSettings);
        evaluateAndApply();
        Spicetify.PopupModal.hide();

        if (Spicetify.showNotification) {
          Spicetify.showNotification("Auto Theme settings saved!");
        }
      });
    }

    Spicetify.PopupModal.display({
      title: "Spicetify Auto-Theme",
      content: container,
      isLarge: false
    });
  }

  // --- Register Spicetify Menu Item ---
  new Spicetify.Menu.Item("Auto Theme Settings", false, openSettingsModal).register();

  // --- Initial Evaluation ---
  evaluateAndApply();

  console.log("[Auto-Theme] Extension successfully loaded and active.");
})();
