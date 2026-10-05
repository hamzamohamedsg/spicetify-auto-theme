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

# 5. On macOS, setup native appearance sync listener
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍏 Setting up macOS Appearance Sync Listener..."
    XPUI_DIR="/Applications/Spotify.app/Contents/Resources/Apps/xpui"
    if [ -d "$XPUI_DIR" ]; then
        mkdir -p "$SCRIPT_DIR/bin"
        if command -v clang >/dev/null 2>&1 && [ ! -f "$SCRIPT_DIR/bin/spicetify-theme-listener" ]; then
            if [ -f "$SCRIPT_DIR/bin/spicetify-theme-listener.m" ]; then
                clang -O3 -framework Foundation -framework CoreFoundation -o "$SCRIPT_DIR/bin/spicetify-theme-listener" "$SCRIPT_DIR/bin/spicetify-theme-listener.m"
            else
                clang -O3 -framework Foundation -framework CoreFoundation -o "$SCRIPT_DIR/bin/spicetify-theme-listener" -x objective-c - << 'EOF'
#import <Foundation/Foundation.h>
#import <CoreFoundation/CoreFoundation.h>
static void updateAppearance(NSString *path) {
    CFPreferencesSynchronize(CFSTR("kCFPreferencesAnyApplication"), kCFPreferencesCurrentUser, kCFPreferencesCurrentHost);
    CFPropertyListRef val = CFPreferencesCopyValue(
        CFSTR("AppleInterfaceStyle"),
        CFSTR("kCFPreferencesAnyApplication"),
        kCFPreferencesCurrentUser,
        kCFPreferencesCurrentHost
    );
    BOOL isDark = NO;
    if (val != NULL) {
        if (CFGetTypeID(val) == CFStringGetTypeID()) {
            isDark = [(__bridge NSString *)val isEqualToString:@"Dark"];
        }
        CFRelease(val);
    }
    NSString *json = [NSString stringWithFormat:@"{\"appearance\":\"%s\",\"updated\":%ld}\n", isDark ? "dark" : "light", (long)[[NSDate date] timeIntervalSince1970]];
    [json writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:nil];
}
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSString *path = @"/Applications/Spotify.app/Contents/Resources/Apps/xpui/os-appearance.json";
        updateAppearance(path);
        [[NSDistributedNotificationCenter defaultCenter] addObserverForName:@"AppleInterfaceThemeChangedNotification"
                                                                      object:nil
                                                                       queue:[NSOperationQueue mainQueue]
                                                                  usingBlock:^(NSNotification * _Nonnull note) {
            updateAppearance(path);
        }];
        [[NSRunLoop currentRunLoop] run];
    }
    return 0;
}
EOF
            fi
        fi
        if [ -f "$SCRIPT_DIR/bin/spicetify-theme-listener" ]; then
            chmod +x "$SCRIPT_DIR/bin/spicetify-theme-listener"
            "$SCRIPT_DIR/bin/spicetify-theme-listener" &
            LISTENER_INIT_PID=$!
            sleep 0.2
            kill $LISTENER_INIT_PID 2>/dev/null || true

            mkdir -p "$HOME/Library/LaunchAgents"
            cat << EOF > "$HOME/Library/LaunchAgents/com.spicetify.auto-theme-sync.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.spicetify.auto-theme-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>$SCRIPT_DIR/bin/spicetify-theme-listener</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
            launchctl unload "$HOME/Library/LaunchAgents/com.spicetify.auto-theme-sync.plist" 2>/dev/null || true
            launchctl load "$HOME/Library/LaunchAgents/com.spicetify.auto-theme-sync.plist"
            echo "✅ macOS appearance listener active (0% CPU, passive event observer)."
        fi
    fi
fi

# 6. Enable extension in Spicetify configuration
if [ -n "$SPICETIFY_BIN" ]; then
    echo "⚙️  Enabling extension in Spicetify config..."
    CURRENT_EXTS="$("$SPICETIFY_BIN" config extensions 2>/dev/null || true)"
    if echo "$CURRENT_EXTS" | grep -q "auto-theme.js"; then
        echo "ℹ️  Extension is already enabled in config."
    else
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
