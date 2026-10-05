# Spicetify Auto Theme Switcher 🌗

A lightweight, zero-daemon [Spicetify](https://spicetify.app/) extension that automatically switches your Spotify theme between dark and light color schemes based on your system appearance (macOS, Windows, or Linux).

---

## ✨ Features

- **🌐 Truly Universal**: Works with **any Spicetify theme**—whether installed from the Marketplace, Spicetify Themes repository, or locally custom-built.
- **⚡ Instant Real-Time Switching**: Responds immediately when your system switches between dark and light appearance (`prefers-color-scheme`).
- **🎵 Zero Playback Interruption**: Updates colors dynamically in-place via DOM CSS custom properties (`--spice-*` and `--spice-rgb-*`). No Spotify reloads, page refreshes, or audio pauses.
- **🔘 Top Bar Quick Access**: Adds a dedicated theme icon button directly to Spotify's top navigation bar for 1-click access to settings.
- **⚙️ In-App Settings UI**:
  - Automatically detects your currently active theme.
  - Lists all available color schemes in selectable dropdowns.
  - Allows freely typing **any custom scheme name** for full flexibility.
  - Remembers dark and light preferences **per theme**.
- **🪶 Zero Background Daemons**: Runs entirely within Spotify's CEF runtime. No battery-draining cron jobs, polling loops, or external helper apps.

---

## 🚀 Quick Install

### Automated Installer (macOS & Linux)

Clone the repository and run the install script:

```bash
git clone https://github.com/mmtechstore/spicetify-auto-theme.git
cd spicetify-auto-theme
./install.sh
```

### Manual Installation

1. Copy `auto-theme.js` to your Spicetify Extensions directory:
   - **macOS / Linux**: `~/.config/spicetify/Extensions/auto-theme.js`
   - **Windows**: `%appdata%\spicetify\Extensions\auto-theme.js`

2. Enable the extension in Spicetify:
   ```bash
   spicetify config extensions auto-theme.js
   spicetify apply
   ```

---

## 🛠️ Usage & Configuration

1. Open **Spotify**.
2. Click the **Auto Theme button (contrast circle icon)** in the top navigation bar (or choose **Auto Theme Settings** from the profile menu).
3. In the settings dialog:
   - View your currently active theme.
   - Choose or type your desired **Dark Mode Color Scheme** (e.g. `Base`, `Dark`, `Mocha`, etc.).
   - Choose or type your desired **Light Mode Color Scheme** (e.g. `Orange`, `Light`, `Latte`, etc.).
   - Toggle **Enable Automatic Switching** on or off.
4. Click **Save & Apply**.
5. Switch your OS appearance in System Settings to see Spotify change colors instantly!

---

## 🔍 How It Works

Spicetify themes define CSS custom properties on the `:root` element (e.g., `--spice-text`, `--spice-main`, `--spice-sidebar`, and `--spice-rgb-*`).

1. **Appearance Detection**: Listens to Chromium's native `window.matchMedia('(prefers-color-scheme: dark)')` event.
2. **Universal Scheme Discovery**:
   - Queries Spicetify Marketplace's cache and exported theme records.
   - Automatically fetches and parses `color.ini` from the Spicetify themes repository if needed.
   - Falls back gracefully to user-specified custom scheme names.
3. **Dynamic Style Injection**: Injects an overriding `<style id="spicetify-auto-theme">` tag with the target scheme's color definitions.
4. **State Persistence**: Saves settings into local storage with per-theme mappings.

---

## 🧪 Testing

The repository includes a comprehensive test suite covering INI parsing, color conversion, state management, modal generation, and live event integration:

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE)
