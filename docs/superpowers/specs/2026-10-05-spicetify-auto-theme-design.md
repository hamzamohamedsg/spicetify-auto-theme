# Design Specification: Spicetify Auto-Theme Extension

**Date**: 2026-10-05  
**Topic**: Automatic Dark/Light Mode Theme & Scheme Switcher for Spicetify  
**Status**: Approved (Draft for Implementation)

---

## 1. Overview & Motivation

When using customized Spicetify themes (such as *StarryNight*, *Catppuccin*, *Sleek*, *Comfy*, etc.) on macOS, themes often provide distinct color schemes for dark environments (e.g. `Base`, `Mocha`) and light environments (e.g. `Orange`, `Latte`). Currently, users must manually navigate to the Spicetify Marketplace tab or execute command-line updates (`spicetify config color_scheme <scheme> && spicetify apply`) to toggle between them.

The **Spicetify Auto-Theme Extension** is a lightweight Spicetify extension that monitors the operating system's color mode in real time and automatically swaps color schemes dynamically without reloading Spotify or interrupting playback. It includes a user-friendly configuration modal within the Spotify interface, allowing users to pick which color scheme maps to Dark mode and which maps to Light mode for any installed theme.

---

## 2. Goals & Non-Goals

### Goals
* **Real-time OS sync**: Automatically detect macOS appearance changes (`Dark` vs. `Light`) and update theme styles immediately.
* **Zero audio interruption / No reload**: Apply theme variables directly to the DOM (`:root` CSS variables) so music does not pause and Spotify does not reload.
* **Theme-agnostic**: Work with any theme that supplies multiple schemes (including *StarryNight*, *Catppuccin*, *Sleek*, *Dribbblish*, etc.).
* **Built-in Configuration UI**: Provide an in-app Spicetify settings modal allowing users to:
  * Enable/disable auto-switching.
  * Pick which scheme is used for Dark mode.
  * Pick which scheme is used for Light mode.
* **Marketplace state synchronization**: Keep `Spicetify.Config.color_scheme` and Marketplace's `activeScheme` in `localStorage` in sync so the Marketplace UI accurately reflects the active palette.
* **Clean Open-Source Repository**: Create a standalone GitHub repository containing documentation, installer script, and extension manifest.

### Non-Goals
* Running external background helper daemons on macOS (all logic is self-contained within the Spicetify client extension).
* Forcing a full `spicetify apply` reload, which would break playback.

---

## 3. Architecture & Data Flow

### 3.1 Components
1. **Core Extension (`auto-theme.js`)**:
   * **Lifecycle Manager**: Initializes when Spicetify APIs (`Spicetify.LocalStorage`, `Spicetify.Menu`, etc.) are ready.
   * **OS Observer**: Listens to `window.matchMedia('(prefers-color-scheme: dark)')` change events.
   * **Theme & Scheme Resolver**: Reads the active theme and available schemes from Marketplace local storage (`marketplace:theme-installed`).
   * **Style Injector**: Converts scheme color hex definitions into CSS custom properties (`--spice-*` and `--spice-rgb-*`) and updates the active `<style>` tag in `document.head`.
   * **Settings UI**: Renders an interactive configuration modal using Spicetify's UI components and styles.

2. **Configuration Store (`Spicetify.LocalStorage`)**:
   * Storage key: `spicetify-auto-theme:settings`
   * Structure:
     ```json
     {
       "enabled": true,
       "darkScheme": "Base",
       "lightScheme": "Orange"
     }
     ```

### 3.2 Data Flow Diagram

```
                 +---------------------------+
                 |    macOS Appearance       |
                 | (Dark / Light Mode event) |
                 +-------------+-------------+
                               |
                               v
                 +---------------------------+
                 |  window.matchMedia        |
                 | (prefers-color-scheme)    |
                 +-------------+-------------+
                               |
                               v
                 +---------------------------+
                 |  Auto-Theme Extension     |
                 | (Evaluates desired scheme)|
                 +-------------+-------------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+-------------------------------+         +--------------------------------+
| Inject/Update CSS in DOM      |         | Sync Marketplace State         |
| (<style id="marketplaceScheme">|        | (Spicetify.Config.color_scheme |
|  :root { --spice-... } )      |         |  localStorage.activeScheme)    |
+-------------------------------+         +--------------------------------+
```

---

## 4. Detailed Component Design

### 4.1 Color Injection & Calculation
Spicetify themes define color variables in hex (e.g. `main = 152238`, `sidebar = 142b44`). Spicetify's runtime expects two formats in CSS:
1. `--spice-<variable>: #<hex>;`
2. `--spice-rgb-<variable>: <r>,<g>,<b>;`

The extension implements a color converter `hexToRGB(hex)` that converts 3-character and 6-character hex values to comma-separated RGB decimal values. When a scheme change triggers:
* If the theme's `<style class="marketplaceCSS marketplaceScheme">` exists, its inner HTML is replaced with the newly calculated `:root` variables.
* If a custom `<style id="auto-theme-override">` is preferred, it injects high-priority `:root` properties directly.

### 4.2 Settings Modal UI
* Added to the Spotify UI via `new Spicetify.Menu.Item("Auto Theme Settings", false, openSettingsModal)`.
* Modal is constructed with standard Spicetify modal classes (`main-trackCreditsModal-container`, button classes, and form inputs) for a native Spotify look and feel.
* Contains:
  1. **Toggle Switch**: "Enable Automatic Switching" (Checkbox / Toggle).
  2. **Dark Scheme Dropdown**: Dropdown displaying all available schemes detected from the current theme, with the current dark selection highlighted.
  3. **Light Scheme Dropdown**: Dropdown displaying all available schemes, with the current light selection highlighted.
  4. **Save Button**: Commits selections to `Spicetify.LocalStorage` and immediately triggers a theme recalculation.

---

## 5. Error Handling & Edge Cases

1. **Theme has only one scheme**:
   * If a theme only has `[Base]` with no alternative scheme, the extension logs an info message and does not attempt switching.
2. **Spicetify hydration delay**:
   * Uses an asynchronous poll loop with exponential backoff / timeout (max 5 seconds) until `Spicetify.LocalStorage`, `Spicetify.Menu`, and Marketplace data are populated.
3. **Missing or custom scheme name**:
   * If a stored scheme name does not exist in the active theme's `schemes` object, the extension falls back to the theme's default active scheme and alerts the user with `Spicetify.showNotification("Auto Theme: Configured scheme not found", true)`.

---

## 6. Project Structure

The project will reside in a standalone Git repository at:
`/Users/mmtechstore/.gemini/antigravity/scratch/spicetify-auto-theme`

```
spicetify-auto-theme/
├── .git/
├── .gitignore
├── LICENSE
├── README.md
├── auto-theme.js
├── manifest.json
├── install.sh
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-10-05-spicetify-auto-theme-design.md
```

---

## 7. Verification & Testing Plan

1. **Static Analysis & Syntax Check**:
   * Validate `auto-theme.js` syntax via node / linter.
2. **Installation Verification**:
   * Install `auto-theme.js` to `~/.config/spicetify/Extensions/auto-theme.js`.
   * Enable in `config-xpui.ini` (`extensions = auto-theme.js`).
   * Apply with Spicetify CLI.
3. **Functional Testing in Spotify**:
   * Verify "Auto Theme Settings" menu item appears in Spotify.
   * Verify available schemes for *StarryNight* (`Base`, `Orange`, etc.) appear in the dropdowns.
   * Toggle macOS appearance between Light and Dark mode using system commands / Control Center.
   * Verify that Spotify immediately transitions between `Base` and `Orange` without audio pause or reload.
