#import <Foundation/Foundation.h>
#import <CoreFoundation/CoreFoundation.h>

/**
 * Spicetify Native macOS Appearance Listener
 *
 * Listens to distributed Darwin/macOS system notifications for dark/light appearance changes.
 * Uses CFPreferencesAppSynchronize and CFPreferencesCopyAppValue(..., kCFPreferencesAnyApplication)
 * to immediately read the global macOS AppleInterfaceStyle preference without delay or caching bugs.
 * Writes os-appearance.json to Spotify's xpui directory with 0% CPU overhead.
 */

static void updateAppearance(NSString *path) {
    // Synchronize global preferences domain
    CFPreferencesAppSynchronize(kCFPreferencesAnyApplication);

    CFPropertyListRef val = CFPreferencesCopyAppValue(
        CFSTR("AppleInterfaceStyle"),
        kCFPreferencesAnyApplication
    );

    BOOL isDark = NO;
    if (val != NULL) {
        if (CFGetTypeID(val) == CFStringGetTypeID()) {
            isDark = [(__bridge NSString *)val caseInsensitiveCompare:@"Dark"] == NSOrderedSame;
        }
        CFRelease(val);
    }

    NSString *json = [NSString stringWithFormat:@"{\"appearance\":\"%s\",\"updated\":%ld}\n",
                      isDark ? "dark" : "light",
                      (long)[[NSDate date] timeIntervalSince1970]];

    NSError *err = nil;
    [json writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:&err];
    if (err) {
        NSLog(@"[Auto-Theme Listener] Error writing appearance file: %@", err);
    }
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
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(50 * NSEC_PER_MSEC)), dispatch_get_main_queue(), ^{
                updateAppearance(path);
            });
        }];

        // Keep event loop alive with 0% CPU consumption
        [[NSRunLoop currentRunLoop] run];
    }
    return 0;
}
