#import <Foundation/Foundation.h>
#import <CoreFoundation/CoreFoundation.h>
#import <notify.h>

/**
 * Spicetify Native macOS Appearance Listener
 *
 * Listens to distributed Darwin/macOS system notifications for dark/light appearance changes.
 * Uses CFPreferencesAppSynchronize and CFPreferencesCopyAppValue(..., kCFPreferencesAnyApplication)
 * to immediately read the global macOS AppleInterfaceStyle preference without delay or caching bugs.
 * Incorporates Darwin notifications (com.apple.system.appearance, sleep/wake events) and a lightweight
 * 1-second GCD heartbeat timer to guarantee continuous synchronization even across system sleep/wake,
 * sunrise/sunset scheduled transitions, or Spotify updates.
 */

static int gLastWrittenIsDark = -1;

static NSArray<NSString *> *getXPUIPaths(void) {
    NSMutableArray *paths = [NSMutableArray array];
    NSString *systemPath = @"/Applications/Spotify.app/Contents/Resources/Apps/xpui/os-appearance.json";
    [paths addObject:systemPath];

    NSString *userPath = [NSHomeDirectory() stringByAppendingPathComponent:@"Applications/Spotify.app/Contents/Resources/Apps/xpui/os-appearance.json"];
    [paths addObject:userPath];
    return paths;
}

static BOOL readCurrentAppearanceIsDark(void) {
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
    return isDark;
}

static void syncAppearance(BOOL force) {
    BOOL isDark = readCurrentAppearanceIsDark();
    int currentInt = isDark ? 1 : 0;

    NSFileManager *fm = [NSFileManager defaultManager];
    NSArray<NSString *> *paths = getXPUIPaths();

    BOOL needsWrite = force || (currentInt != gLastWrittenIsDark);

    if (!needsWrite) {
        // Ensure destination files still exist on disk (e.g. after spicetify apply or Spotify update)
        for (NSString *p in paths) {
            NSString *parentDir = [p stringByDeletingLastPathComponent];
            if ([fm fileExistsAtPath:parentDir] && ![fm fileExistsAtPath:p]) {
                needsWrite = YES;
                break;
            }
        }
    }

    if (!needsWrite) return;

    NSString *json = [NSString stringWithFormat:@"{\"appearance\":\"%s\",\"updated\":%ld}\n",
                      isDark ? "dark" : "light",
                      (long)[[NSDate date] timeIntervalSince1970]];
    NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];

    for (NSString *p in paths) {
        NSString *parentDir = [p stringByDeletingLastPathComponent];
        if ([fm fileExistsAtPath:parentDir]) {
            [data writeToFile:p atomically:YES];
        }
    }

    gLastWrittenIsDark = currentInt;
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        // Initial sync on launch
        syncAppearance(YES);

        // 1. Instant event-driven notification observer via NSDistributedNotificationCenter
        [[NSDistributedNotificationCenter defaultCenter] addObserverForName:@"AppleInterfaceThemeChangedNotification"
                                                                      object:nil
                                                                       queue:[NSOperationQueue mainQueue]
                                                                  usingBlock:^(NSNotification * _Nonnull note) {
            syncAppearance(YES);
        }];

        // 2. Darwin low-level notifications
        int token1, token2, token3;
        notify_register_dispatch("AppleInterfaceThemeChangedNotification", &token1, dispatch_get_main_queue(), ^(int token) {
            syncAppearance(YES);
        });
        notify_register_dispatch("com.apple.system.appearance", &token2, dispatch_get_main_queue(), ^(int token) {
            syncAppearance(YES);
        });
        // System wake from sleep observer
        notify_register_dispatch("com.apple.system.powermanagement.systemwillwake", &token3, dispatch_get_main_queue(), ^(int token) {
            syncAppearance(YES);
        });

        // 3. Periodic heartbeat timer (1.0s coalesced, ~0% CPU, ensures resilience across sleep/wake & auto sunrise)
        dispatch_source_t timer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_main_queue());
        dispatch_source_set_timer(timer, dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC), 1 * NSEC_PER_SEC, 200 * NSEC_PER_MSEC);
        dispatch_source_set_event_handler(timer, ^{
            syncAppearance(NO);
        });
        dispatch_resume(timer);

        // GCD main dispatch loop
        dispatch_main();
    }
    return 0;
}
