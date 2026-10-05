# Spicetify Auto-Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Spicetify extension that automatically switches between dark and light color schemes based on macOS system appearance, complete with an in-app settings UI and a standalone Git repository.

**Architecture:** A standalone JavaScript extension for Spotify/Spicetify that hooks into `window.matchMedia('(prefers-color-scheme: dark)')`, resolves theme schemes from Spicetify's storage, dynamically swaps `:root` CSS variables in the DOM without reloading or interrupting music playback, and exposes a native settings modal via `Spicetify.Menu`.

**Tech Stack:** Vanilla JavaScript (ES6+), Spicetify Web API, CSS3 Custom Properties, Node.js built-in `node:test` test runner.

**Spec:** [`docs/superpowers/specs/2026-10-05-spicetify-auto-theme-design.md`](file:///Users/mmtechstore/.gemini/antigravity/scratch/spicetify-auto-theme/docs/superpowers/specs/2026-10-05-spicetify-auto-theme-design.md)

## Global Constraints

* Target platform: macOS Spotify desktop client with Spicetify CLI / Marketplace.
* Zero external runtime dependencies in `auto-theme.js` (native browser/Spicetify APIs only).
* Zero background processes/daemons outside Spotify.
* Music playback must never pause during scheme switching.
* Unit tests must run using Node.js built-in `node:test` (no heavy third-party test framework needed).

## Review Focus

1. **Malformatted or missing hex codes in theme definition**: `hexToRGB` must handle 3-char, 6-char, uppercase, lowercase, and gracefully ignore non-hex values without crashing the extension.
2. **Delayed Spicetify initialization**: Polling routine must gracefully back off and time out if Spotify loads slowly, without throwing uncaught exceptions.
3. **Active theme has only one scheme**: If a user switches to a theme without multiple schemes, auto-switching should gracefully pause and not wipe styles.
4. **Marketplace storage missing or altered**: If `marketplace:theme-installed` key is missing, fall back to safe defaults without crashing.
5. **Dynamic OS change rapid toggling**: Rapid switching between dark and light mode (e.g. testing in Control Center) must cleanly debounce or atomically replace the style tag without DOM duplication.

---

### Task 1: Color Utilities and Style Generator

**Files:**
- Create: `src/utils.js`
- Test: `tests/utils.test.js`

**Interfaces:**
- Produces:
  - `hexToRGB(hex: string): string` (converts `FFFFFF` -> `255,255,255`, `FFF` -> `255,255,255`)
  - `generateSchemeCSS(schemeColors: Record<string, string>, targetSelector?: string): string` (formats `--spice-*` and `--spice-rgb-*` CSS rules)

- [ ] **Step 1: Write the failing tests in `tests/utils.test.js`**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { hexToRGB, generateSchemeCSS } from "../src/utils.js";

test("hexToRGB converts 6-character hex to comma-separated RGB", () => {
  assert.strictEqual(hexToRGB("FFFFFF"), "255,255,255");
  assert.strictEqual(hexToRGB("#152238"), "21,34,56");
  assert.strictEqual(hexToRGB("000000"), "0,0,0");
});

test("hexToRGB converts 3-character hex", () => {
  assert.strictEqual(hexToRGB("FFF"), "255,255,255");
  assert.strictEqual(hexToRGB("#000"), "0,0,0");
});

test("hexToRGB handles 8-character rgba hex or invalid strings safely", () => {
  assert.strictEqual(hexToRGB("00000000"), "0,0,0");
  assert.strictEqual(hexToRGB("invalid"), "0,0,0");
});

test("generateSchemeCSS creates valid :root CSS custom properties", () => {
  const colors = { main: "152238", text: "FFFFFF" };
  const css = generateSchemeCSS(colors);
  assert.match(css, /--spice-main: #152238;/);
  assert.match(css, /--spice-rgb-main: 21,34,56;/);
  assert.match(css, /--spice-text: #FFFFFF;/);
  assert.match(css, /--spice-rgb-text: 255,255,255;/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/utils.test.js`  
Expected: FAIL with "Cannot find module '../src/utils.js'"

- [ ] **Step 3: Implement `hexToRGB` and `generateSchemeCSS` in `src/utils.js`**

Implement string sanitation, regex matching for hex patterns, RGB parsing, and CSS formatting.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/utils.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils.js tests/utils.test.js
git commit -m "feat: add color conversion and CSS generation utilities"
```

---

### Task 2: State Management & Theme Resolution

**Files:**
- Create: `src/themeManager.js`
- Test: `tests/themeManager.test.js`

**Interfaces:**
- Consumes: `generateSchemeCSS` from `src/utils.js`
- Produces:
  - `loadSettings(storage: Storage): Settings`
  - `saveSettings(storage: Storage, settings: Settings): void`
  - `getAvailableSchemes(storage: Storage): { themeName: string, schemes: Record<string, Record<string, string>> } | null`
  - `determineTargetScheme(settings: Settings, isDark: boolean, availableSchemes: string[]): string | null`

- [ ] **Step 1: Write the failing tests in `tests/themeManager.test.js`**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { loadSettings, saveSettings, determineTargetScheme, getAvailableSchemes } from "../src/themeManager.js";

test("loadSettings returns defaults when storage is empty", () => {
  const mockStorage = { getItem: () => null, setItem: () => {} };
  const settings = loadSettings(mockStorage);
  assert.deepStrictEqual(settings, { enabled: true, darkScheme: "Base", lightScheme: "Orange" });
});

test("saveSettings and loadSettings persist custom configuration", () => {
  const store = {};
  const mockStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; }
  };
  saveSettings(mockStorage, { enabled: false, darkScheme: "Dark", lightScheme: "Light" });
  assert.deepStrictEqual(loadSettings(mockStorage), { enabled: false, darkScheme: "Dark", lightScheme: "Light" });
});

test("determineTargetScheme picks darkScheme when isDark is true", () => {
  const settings = { enabled: true, darkScheme: "Base", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, true, ["Base", "Orange", "Galaxy"]);
  assert.strictEqual(target, "Base");
});

test("determineTargetScheme picks lightScheme when isDark is false", () => {
  const settings = { enabled: true, darkScheme: "Base", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, false, ["Base", "Orange", "Galaxy"]);
  assert.strictEqual(target, "Orange");
});

test("determineTargetScheme falls back gracefully when scheme does not exist", () => {
  const settings = { enabled: true, darkScheme: "NonExistent", lightScheme: "Orange" };
  const target = determineTargetScheme(settings, true, ["Base", "Orange"]);
  assert.strictEqual(target, "Base");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/themeManager.test.js`  
Expected: FAIL with "Cannot find module '../src/themeManager.js'"

- [ ] **Step 3: Implement settings and theme manager functions in `src/themeManager.js`**

Implement loading/saving from `spicetify-auto-theme:settings` key, fallback logic, and reading Marketplace theme record.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/themeManager.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/themeManager.js tests/themeManager.test.js
git commit -m "feat: implement settings persistence and theme scheme resolution"
```

---

### Task 3: Settings UI Modal Component

**Files:**
- Create: `src/settingsModal.js`
- Test: `tests/settingsModal.test.js`

**Interfaces:**
- Consumes: `Settings` and theme scheme data from `src/themeManager.js`
- Produces:
  - `renderSettingsModal(options: { settings: Settings, schemes: string[], onSave: (newSettings) => void, onClose: () => void }): { element: HTMLElement, update: () => void }`

- [ ] **Step 1: Write mock-DOM test in `tests/settingsModal.test.js`**

Verify that `renderSettingsModal` builds the form structure with:
- Checkbox toggle for "Auto Switch"
- Dropdown for Dark Scheme with all available scheme options
- Dropdown for Light Scheme with all available scheme options
- Save and Close buttons calling callbacks

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/settingsModal.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement `renderSettingsModal` in `src/settingsModal.js`**

Construct the Spotify-styled modal dialog using native DOM methods, apply styling classes matching Spicetify's UI theme, and wire event handlers.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/settingsModal.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/settingsModal.js tests/settingsModal.test.js
git commit -m "feat: create settings modal UI for selecting dark and light schemes"
```

---

### Task 4: Main Extension Bundle & OS Listener

**Files:**
- Create: `auto-theme.js`
- Test: `tests/integration.test.js`

**Interfaces:**
- Bundles all modules into a self-contained, standalone Spicetify extension file (`auto-theme.js`).
- Hooks into `Spicetify.LocalStorage`, `Spicetify.Menu`, and `window.matchMedia('(prefers-color-scheme: dark)')`.

- [ ] **Step 1: Write integration tests in `tests/integration.test.js`**

Verify end-to-end simulation:
- Initial state: macOS is in Dark mode -> applies `Base` scheme.
- Media query event triggers with `matches: false` -> dynamically replaces style tag with `Orange` scheme CSS.
- Verifies Marketplace localStorage sync.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/integration.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement complete `auto-theme.js`**

Assemble the self-executing IIFE extension:
1. Wait for `Spicetify.LocalStorage` and DOM readiness.
2. Register the "Auto Theme Settings" item in `Spicetify.Menu`.
3. Register the `matchMedia` listener on `(prefers-color-scheme: dark)`.
4. Implement atomic style tag replacement (`<style id="spicetify-auto-theme">` and updating `<style class="marketplaceCSS marketplaceScheme">`).
5. Update `Spicetify.Config.color_scheme` and Marketplace `activeScheme`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/integration.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add auto-theme.js tests/integration.test.js
git commit -m "feat: complete auto-theme extension with real-time OS listener"
```

---

### Task 5: Packaging, Installer & Repository Documentation

**Files:**
- Create: `manifest.json`
- Create: `install.sh`
- Create: `README.md`
- Create: `LICENSE`
- Create: `package.json`

- [ ] **Step 1: Create `manifest.json` for Spicetify Marketplace compatibility**

Define extension metadata, title, description, and author.

- [ ] **Step 2: Create `install.sh` installer script**

Write a POSIX shell script that:
- Detects the Spicetify config directory (`~/.config/spicetify`).
- Copies `auto-theme.js` to `~/.config/spicetify/Extensions/auto-theme.js`.
- Automatically adds `auto-theme.js` to `config-xpui.ini` under `extensions =`.
- Runs `spicetify apply` using the local Spicetify binary.

- [ ] **Step 3: Create `README.md`, `LICENSE` (MIT), and `package.json`**

Document features, installation methods (manual, curl one-liner, and marketplace), configuration instructions, and test scripts.

- [ ] **Step 4: Test installer script in dry-run mode**

Verify file permissions and script execution.

- [ ] **Step 5: Commit**

```bash
git add manifest.json install.sh README.md LICENSE package.json
git commit -m "chore: add documentation, installer, and marketplace manifest"
```

---

### Task 6: Deployment & Live Client Verification

**Files:**
- Target: `~/.config/spicetify/Extensions/auto-theme.js`
- Target: `~/.config/spicetify/config-xpui.ini`

- [ ] **Step 1: Install `auto-theme.js` into Spicetify Extensions**

Copy `auto-theme.js` to `/Users/mmtechstore/.config/spicetify/Extensions/auto-theme.js`.

- [ ] **Step 2: Register extension in `config-xpui.ini`**

Update `extensions = auto-theme.js` in `/Users/mmtechstore/.config/spicetify/config-xpui.ini`.

- [ ] **Step 3: Apply Spicetify changes**

Execute `/Users/mmtechstore/.spicetify/spicetify apply` to reload Spotify with the extension active.

- [ ] **Step 4: Verify in Spotify**

1. Verify the extension loads without console errors.
2. Verify "Auto Theme Settings" appears in the Spicetify menu.
3. Test toggling macOS appearance between Dark and Light mode.
4. Verify that StarryNight switches automatically between `Base` and `Orange`.
