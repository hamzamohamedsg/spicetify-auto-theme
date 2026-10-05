# Spicetify Auto Theme Switcher 🌗

![Auto Theme Switcher](preview.png)

A lightweight, universal [Spicetify](https://spicetify.app/) extension that automatically switches your Spotify theme between dark and light color schemes based on your system appearance (macOS, Windows, or Linux) or a custom schedule.

---

## ✨ Features

- **🌐 Truly Universal**: Works with **any Spicetify theme**—whether installed from the Marketplace, Spicetify Themes repository, or locally custom-built.
- **⚡ Sub-500ms Instant Switching**: Responds immediately when your system switches between dark and light appearance.
- **🎵 Zero Playback Interruption**: Updates colors dynamically in-place via DOM CSS custom properties (`--spice-*` and `--spice-rgb-*`). No Spotify reloads, page refreshes, or audio pauses.
- **🔘 Top Bar Quick Access & Toggle**: Adds a dedicated theme icon button directly to Spotify's top navigation bar for 1-click settings and quick toggling.
- **⚙️ In-App Settings UI**:
  - Automatically detects your currently active theme.
  - Lists all available color schemes in selectable dropdowns.
  - Allows freely choosing or typing **any custom scheme name**.
  - Remembers dark and light preferences **per theme**.
  - Supports **System Appearance**, **Day/Night Schedule**, and **Custom Hours** modes.
- **🪶 Zero-Overhead**: Passive event-driven listener on macOS and Chromium media queries on Windows/Linux with 0% CPU consumption.

---

## 🛒 Installation via Spicetify Marketplace

Once indexed in Marketplace:
1. Open Spotify and navigate to **Marketplace** (shopping bag icon).
2. Go to the **Extensions** tab.
3. Search for **Auto Theme Switcher**.
4. Click **Install**.

---

## 🚀 Manual / CLI Installation

### Automated Installer (macOS & Linux)

Clone the repository and run the install script:

```bash
git clone https://github.com/hamzamohamedsg/spicetify-auto-theme.git
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
2. Click the **Auto Theme button (contrast circle icon)** in the top navigation bar (or choose **Auto Theme Settings** from your profile menu).
3. In the settings dialog:
   - View your currently active theme.
   - Choose your preferred **Dark Mode Color Scheme** (e.g., `Base`, `Dark`, `Mocha`).
   - Choose your preferred **Light Mode Color Scheme** (e.g., `Orange`, `Light`, `Latte`).
   - Select your mode: **System Appearance (Live macOS/OS)**, **Sun Schedule (Day / Night)**, or **Custom Hours**.
   - Toggle **Enable Automatic Switching** on or off.
4. Click **Save & Apply**.
5. Switch your OS appearance in System Settings or let the schedule run—Spotify will adapt seamlessly!

---

## 🧪 Testing

The repository includes a comprehensive test suite covering INI parsing, color conversion, state management, modal generation, and live event integration:

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE)
