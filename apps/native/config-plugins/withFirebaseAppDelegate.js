const { withAppDelegate } = require("expo/config-plugins");

/**
 * As of Expo SDK 56, the generated iOS AppDelegate is a Swift file whose shape
 * @react-native-firebase/app's config plugin can no longer pattern-match
 * (it logs "Unable to determine correct Firebase insertion point in
 * AppDelegate.swift" and skips patching). Without this, `FirebaseApp` is never
 * configured and any @react-native-firebase/* call throws at runtime.
 *
 * This plugin inserts `FirebaseApp.configure()` directly after the
 * `reactNativeFactory = factory` assignment inside
 * `application(_:didFinishLaunchingWithOptions:)`, which is idempotent across
 * `expo prebuild` runs (skips if already present).
 */
const withFirebaseAppDelegate = (config) => {
  return withAppDelegate(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes("FirebaseApp.configure()")) {
      return config;
    }

    if (!contents.includes("reactNativeFactory = factory")) {
      throw new Error(
        "withFirebaseAppDelegate: could not find anchor `reactNativeFactory = factory` in AppDelegate.swift. " +
          "The generated AppDelegate template may have changed; update this plugin.",
      );
    }

    config.modResults.contents = contents.replace(
      "reactNativeFactory = factory",
      "reactNativeFactory = factory\n\n    FirebaseApp.configure()",
    );

    return config;
  });
};

module.exports = withFirebaseAppDelegate;
