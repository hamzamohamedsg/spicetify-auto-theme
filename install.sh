#!/usr/bin/env bash
set -e

# ==============================================================================
# Spicetify Auto Theme Switcher - Installation Script
# ==============================================================================

echo "🎨 Installing Spicetify Auto Theme Switcher..."

# 1. Locate spicetify binary
SPICETIFY_BIN=""
if command -v spicetify >/dev/null 2>&1; then
    SPICETIFY_BIN="$(command -v spicetify)"
elif [ -f "$HOME/.spicetify/spicetify" ]; then
    SPICETIFY_BIN="$HOME/.spicetify/spicetify"
elif [ -f "$HOME/spicetify-cli/spicetify" ]; then
    SPICETIFY_BIN="$HOME/spicetify-cli/spicetify"
fi

# 2. Determine Spicetify Extensions directory
EXT_DIR=""
if [ -n "$SPICETIFY_BIN" ]; then
    CONFIG_DIR="$("$SPICETIFY_BIN" -c 2>/dev/null | xargs dirname 2>/dev/null || true)"
    if [ -n "$CONFIG_DIR" ] && [ -d "$CONFIG_DIR" ]; then
        EXT_DIR="$CONFIG_DIR/Extensions"
    fi
fi

if [ -z "$EXT_DIR" ]; then
    if [ -d "$HOME/.config/spicetify/Extensions" ]; then
        EXT_DIR="$HOME/.config/spicetify/Extensions"
    elif [ -d "$HOME/.spicetify/Extensions" ]; then
        EXT_DIR="$HOME/.spicetify/Extensions"
    elif [ -d "$APPDATA/spicetify/Extensions" ]; then
        EXT_DIR="$APPDATA/spicetify/Extensions"
    else
        EXT_DIR="$HOME/.config/spicetify/Extensions"
    fi
fi

mkdir -p "$EXT_DIR"

# 3. Locate source file (same directory as install script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/auto-theme.js"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: auto-theme.js not found in $SCRIPT_DIR"
    exit 1
fi

# 4. Copy auto-theme.js to Extensions folder
cp "$SOURCE_FILE" "$EXT_DIR/auto-theme.js"
echo "✅ Copied auto-theme.js to $EXT_DIR/auto-theme.js"

# 5. Enable extension in Spicetify configuration
if [ -n "$SPICETIFY_BIN" ]; then
    echo "⚙️  Enabling extension in Spicetify config..."
    # Spicetify syntax: spicetify config extensions <ext> (or <ext>+ to append)
    # Check if already present in config
    CURRENT_EXTS="$("$SPICETIFY_BIN" config extensions 2>/dev/null || true)"
    if echo "$CURRENT_EXTS" | grep -q "auto-theme.js"; then
        echo "ℹ️  Extension is already enabled in config."
    else
        # Append extension
        "$SPICETIFY_BIN" config extensions auto-theme.js+ 2>/dev/null || "$SPICETIFY_BIN" config extensions auto-theme.js
        echo "✅ Added auto-theme.js to Spicetify extensions."
    fi

    echo "🚀 Applying changes to Spotify..."
    "$SPICETIFY_BIN" apply
    echo "🎉 Done! Auto Theme Switcher is installed and active in Spotify."
else
    echo "⚠️  Spicetify binary was not found in PATH or standard directories."
    echo "   Please add 'auto-theme.js' to your Spicetify config manually:"
    echo "     spicetify config extensions auto-theme.js"
    echo "     spicetify apply"
fi
