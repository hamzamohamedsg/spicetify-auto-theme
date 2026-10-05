# Spicetify Auto Theme Switcher 🌗

A lightweight, zero-daemon [Spicetify](https://spicetify.app/) extension that automatically switches your Spotify theme between dark and light color schemes based on your system appearance (macOS, Windows, or Linux).

---

## ✨ Features

- **⚡ Instant Real-Time Switching**: Responds immediately when your OS switches between dark and light appearance (`prefers-color-scheme`).
- **🎵 Zero Playback Interruption**: Updates colors dynamically in-place via DOM CSS custom properties (`--spice-*` and `--spice-rgb-*`). No Spotify reloads, page refreshes, or audio pauses.
- **⚙️ In-App Settings UI**: Accessible directly from Spotify's Spicetify / Profile menu. Choose which scheme is dark and which is light for whatever theme you have installed.
- **🎨 Works with Any Theme**: Whether you use **StarryNight** (`Base` for dark, `Orange` for light), **Comfy**, **Fluent**, **Sleek**, or any custom theme from the Marketplace.
- **🔄 Marketplace Sync**: Updates Spicetify's active scheme record in local storage so the Marketplace UI stays synchronized.
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
2. Click your **Profile icon** (top right) and select **Auto Theme Settings** (or access it from the Spicetify menu).
3. In the settings dialog:
   - **Enable Auto Switch**: Turn automatic switching on or off.
   - **Dark Mode Scheme**: Choose the color scheme for Dark mode (e.g., `Base` for StarryNight).
   - **Light Mode Scheme**: Choose the color scheme for Light mode (e.g., `Orange` for StarryNight).
4. Click **Save Settings**.
5. Switch your OS appearance in System Settings to see Spotify change colors instantly!

---

## 🔍 How It Works

Spicetify themes define CSS custom properties on the `:root` element (e.g., `--spice-text`, `--spice-main`, `--spice-sidebar`, and their corresponding RGB equivalents `--spice-rgb-*`).

1. **Appearance Detection**: Listens to Chromium's native `window.matchMedia('(prefers-color-scheme: dark)')` event.
2. **Scheme Resolution**: Retrieves available scheme definitions from Spicetify Marketplace's metadata cache.
3. **Dynamic Style Injection**: Injects an overriding `<style id="spicetify-auto-theme-css">` with the targeted scheme's color definitions.
4. **State Persistence**: Updates `localStorage['spicetify-auto-theme-settings']` and Spicetify's active scheme pointer.

---

## 🧪 Testing

The repository includes a comprehensive test suite covering color math, state management, modal generation, and live event integration:

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE)
