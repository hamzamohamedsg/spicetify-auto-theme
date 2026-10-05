/**
 * Generates the inner HTML structure for the Auto Theme Settings modal.
 *
 * @param {{ themeName: string, schemes: string[], settings: { enabled: boolean, darkScheme: string, lightScheme: string } }} param0
 * @returns {string}
 */
export function generateModalHTML({ themeName, schemes, settings }) {
  const schemeList = schemes && schemes.length > 0 ? schemes : [];

  const buildDatalistOptions = () => {
    return schemeList
      .map((s) => `<option value="${s}">`)
      .join("\n");
  };

  const isChecked = settings.enabled ? " checked" : "";

  return `
<div class="auto-theme-modal-container" style="display:flex; flex-direction:column; gap:20px; padding:10px 0; color:var(--spice-text, #ffffff); font-family:var(--font-family, sans-serif);">
  <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
    <h2 style="font-size:22px; font-weight:700; margin:0 0 6px 0;">Auto Theme Settings</h2>
    <p style="font-size:13px; color:var(--spice-subtext, #a7a7a7); margin:0;">
      Automatically switch between dark and light color schemes based on your system appearance.
    </p>
    <div style="margin-top:8px; font-size:13px; opacity:0.9;">
      Active Theme: <strong style="color:var(--spice-button, #1db954);">${themeName || "Default"}</strong>
    </div>
  </div>

  <div style="display:flex; align-items:center; justify-content:space-between;">
    <div>
      <div style="font-size:14px; font-weight:600;">Enable Automatic Switching</div>
      <div style="font-size:12px; color:var(--spice-subtext, #a7a7a7);">Switch color schemes when your system changes between Dark & Light</div>
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

/**
 * Extracts and sanitizes settings from raw form values.
 *
 * @param {{ enabled: boolean, darkScheme: string, lightScheme: string }} values
 * @returns {{ enabled: boolean, darkScheme: string, lightScheme: string }}
 */
export function parseModalFormValues(values) {
  return {
    enabled: Boolean(values.enabled),
    darkScheme: typeof values.darkScheme === "string" && values.darkScheme.trim() ? values.darkScheme.trim() : "Base",
    lightScheme: typeof values.lightScheme === "string" && values.lightScheme.trim() ? values.lightScheme.trim() : "Orange"
  };
}

/**
 * Opens the settings modal in the Spicetify client.
 *
 * @param {{
 *   themeName: string,
 *   schemes: string[],
 *   currentSettings: { enabled: boolean, darkScheme: string, lightScheme: string },
 *   onSave: (newSettings: { enabled: boolean, darkScheme: string, lightScheme: string }) => void
 * }} config
 */
export function openSettingsModal({ themeName, schemes, currentSettings, onSave }) {
  if (typeof Spicetify === "undefined" || !Spicetify.PopupModal) {
    console.warn("[Auto-Theme] Spicetify.PopupModal is not available");
    return;
  }

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
