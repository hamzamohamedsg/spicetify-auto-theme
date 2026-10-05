/**
 * Generates the inner HTML structure for the Auto Theme Settings modal form.
 *
 * @param {{
 *   themeName: string,
 *   availableThemes?: string[],
 *   schemes: string[],
 *   settings: {
 *     enabled: boolean,
 *     mode?: string,
 *     scheduleStartHour?: number,
 *     scheduleEndHour?: number,
 *     darkScheme: string,
 *     lightScheme: string
 *   }
 * }} param0
 * @returns {string}
 */
export function generateModalHTML({ themeName, availableThemes = [], schemes = [], settings }) {
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
    <h2 style="font-size:20px; font-weight:700; margin:0 0 4px 0; display:flex; align-items:center; gap:8px;">
      <span>Auto Theme Settings</span>
    </h2>
    <p style="font-size:12px; color:var(--spice-subtext, #a7a7a7); margin:0;">
      Automatically transition between Dark and Light color schemes without restarting Spotify.
    </p>
  </div>

  <!-- Enable Toggle -->
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

  <!-- Switching Mode Select -->
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

  <!-- Custom Hours Row (shown if mode is custom or schedule) -->
  <div id="auto-theme-hours-container" style="display:${currentMode === "custom" ? "flex" : "none"}; align-items:center; gap:12px; background:rgba(255,255,255,0.04); padding:10px 14px; border-radius:8px;">
    <div style="font-size:12px; color:var(--spice-subtext, #a7a7a7); flex:1;">Daytime / Light Hours (24h format):</div>
    <div style="display:flex; align-items:center; gap:6px;">
      <input type="number" id="auto-theme-start-hour" min="0" max="23" value="${startHour}" style="width:52px; padding:6px 8px; border-radius:4px; background:#181818; color:#fff; border:1px solid rgba(255,255,255,0.2); text-align:center;">
      <span style="font-size:12px;">to</span>
      <input type="number" id="auto-theme-end-hour" min="0" max="23" value="${endHour}" style="width:52px; padding:6px 8px; border-radius:4px; background:#181818; color:#fff; border:1px solid rgba(255,255,255,0.2); text-align:center;">
    </div>
  </div>

  <!-- Theme Selector (if multiple available) -->
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

  <!-- Dark & Light Scheme Dropdowns -->
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

  <!-- Instant Live Preview Action Buttons -->
  <div style="display:flex; gap:10px; align-items:center;">
    <button type="button" id="auto-theme-preview-dark-btn" style="flex:1; padding:8px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-size:12px; font-weight:600; transition:.2s;">
      🌙 Preview Dark Now
    </button>
    <button type="button" id="auto-theme-preview-light-btn" style="flex:1; padding:8px 14px; border-radius:6px; background:rgba(255,255,255,0.1); color:var(--spice-text, #fff); border:1px solid rgba(255,255,255,0.15); cursor:pointer; font-size:12px; font-weight:600; transition:.2s;">
      ☀️ Preview Light Now
    </button>
  </div>

  <!-- Bottom Save Button -->
  <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:6px; border-top:1px solid rgba(255,255,255,0.1); padding-top:14px;">
    <button type="button" id="auto-theme-save-btn" style="padding:10px 24px; border-radius:500px; background:var(--spice-button, #1db954); color:#000; font-weight:700; border:none; cursor:pointer; font-size:14px;">
      Save & Apply
    </button>
  </div>
</div>
`.trim();
}

/**
 * Extracts and sanitizes settings from raw form values.
 *
 * @param {{
 *   enabled: boolean,
 *   mode?: string,
 *   scheduleStartHour?: number|string,
 *   scheduleEndHour?: number|string,
 *   darkScheme: string,
 *   lightScheme: string
 * }} values
 * @returns {{
 *   enabled: boolean,
 *   mode: string,
 *   scheduleStartHour: number,
 *   scheduleEndHour: number,
 *   darkScheme: string,
 *   lightScheme: string
 * }}
 */
export function parseModalFormValues(values) {
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

/**
 * Opens the settings modal in the Spicetify client using a bulletproof,
 * self-contained fixed overlay.
 *
 * @param {{
 *   themeName: string,
 *   availableThemes?: string[],
 *   schemes: string[],
 *   allThemesSchemesMap?: Record<string, string[]>,
 *   currentSettings: {
 *     enabled: boolean,
 *     mode?: string,
 *     scheduleStartHour?: number,
 *     scheduleEndHour?: number,
 *     darkScheme: string,
 *     lightScheme: string
 *   },
 *   onSave: (newSettings: ReturnType<typeof parseModalFormValues>, selectedTheme?: string) => void,
 *   onPreview?: (isDark: boolean, schemeName: string) => void
 * }} config
 */
export function openSettingsModal({
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

  // Form elements
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

  // Toggle slider styling
  if (enabledInput && slider) {
    enabledInput.addEventListener("change", () => {
      slider.style.backgroundColor = enabledInput.checked
        ? "var(--spice-button, #1db954)"
        : "rgba(255,255,255,0.2)";
    });
  }

  // Show/hide custom hours container
  if (modeSelect && hoursContainer) {
    modeSelect.addEventListener("change", () => {
      hoursContainer.style.display = modeSelect.value === "custom" ? "flex" : "none";
    });
  }

  // Handle "+ Enter Custom Scheme..." option
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

  // Dynamic scheme population when theme selector changes
  if (themeSelect && allThemesSchemesMap) {
    themeSelect.addEventListener("change", () => {
      const selectedTheme = themeSelect.value;
      const themeSchemes = allThemesSchemesMap[selectedTheme] || [];
      const populate = (selectEl, currentVal, fallbackVal) => {
        if (!selectEl) return;
        let opts = "";
        for (const s of themeSchemes) {
          opts += `<option value="${s}"${s === currentVal ? " selected" : ""}>${s}</option>\n`;
        }
        opts += `<option value="__custom__">+ Enter Custom Scheme...</option>\n`;
        selectEl.innerHTML = opts;
      };
      populate(darkSelect, currentSettings.darkScheme, "Base");
      populate(lightSelect, currentSettings.lightScheme, "Orange");
    });
  }

  const getEffectiveScheme = (selectEl, customInputEl, fallback) => {
    if (!selectEl) return fallback;
    if (selectEl.value === "__custom__" && customInputEl && customInputEl.value.trim()) {
      return customInputEl.value.trim();
    }
    return selectEl.value || fallback;
  };

  // Live preview buttons
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

  // Save handler
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
