#import <Foundation/Foundation.h>
#import <CoreFoundation/CoreFoundation.h>

/**
 * Spicetify Native macOS Appearance Listener
 *
 * Listens to distributed Darwin/macOS system notifications for dark/light appearance changes.
 * Uses CFPreferencesSynchronize to bypass NSUserDefaults in-memory caching for zero-latency detection.
 * Updates os-appearance.json inside Spotify's xpui directory with near-zero CPU and memory overhead.
 */

static void updateAppearance(NSString *path) {
    // Force synchronize the host/user preferences domain to avoid any caching delays
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

    NSString *json = [NSString stringWithFormat:@"{\"appearance\":\"%s\",\"updated\":%ld}\n",
                      isDark ? "dark" : "light",
                      (long)[[NSDate date] timeIntervalSince1970]];

    [json writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:nil];
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSString *path = @"/Applications/Spotify.app/Contents/Resources/Apps/xpui/os-appearance.json";

        // Initial sync on launch
        updateAppearance(path);

        // Instant event-driven notification observer
        [[NSDistributedNotificationCenter defaultCenter] addObserverForName:@"AppleInterfaceThemeChangedNotification"
                                                                      object:nil
                                                                       queue:[NSOperationQueue mainQueue]
                                                                  usingBlock:^(NSNotification * _Nonnull note) {
            updateAppearance(path);
        }];

        // Keep event loop alive with 0% CPU consumption
        [[NSRunLoop currentRunLoop] run];
    }
    return 0;
}
