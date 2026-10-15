plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val gameEnvironment = project.findProperty("gameEnvironment")?.toString() ?: "debug"
if (gameEnvironment !in setOf("debug", "staging", "production")) throw GradleException("Unsupported gameEnvironment: $gameEnvironment")
// Task 26h: AdMob app id for the manifest. Google's sample app id is the
// fallback, so a build without console provisioning can only ever serve test
// ads (and the Dart config requests none outside debug without real units).
val googleSampleAdMobAppId = "ca-app-pub-3940256099942544~3347511713"
val admobAppId = project.findProperty("LUDO_ADMOB_APP_ID")?.toString()
    ?: System.getenv("LUDO_ADMOB_APP_ID")
    ?: googleSampleAdMobAppId
if (gameEnvironment == "production" && admobAppId == googleSampleAdMobAppId) {
    logger.warn("LUDO_ADMOB_APP_ID is not set: this production build uses Google's sample AdMob app id and will show no real ads.")
}
val androidKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
val androidKeystoreAlias = System.getenv("ANDROID_KEY_ALIAS")
val androidKeystorePassword = System.getenv("ANDROID_KEY_PASSWORD")
val androidStorePassword = System.getenv("ANDROID_STORE_PASSWORD")

android {
    namespace = "app.w3dev.ludo"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    signingConfigs {
        if (gameEnvironment == "production") {
            val keystorePath = androidKeystorePath ?: throw GradleException("ANDROID_KEYSTORE_PATH is required for production builds")
            val keyAlias = androidKeystoreAlias ?: throw GradleException("ANDROID_KEY_ALIAS is required for production builds")
            val keyPassword = androidKeystorePassword ?: throw GradleException("ANDROID_KEY_PASSWORD is required for production builds")
            val storePassword = androidStorePassword ?: throw GradleException("ANDROID_STORE_PASSWORD is required for production builds")
            create("gamesRelease") {
                storeFile = file(keystorePath)
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
                this.storePassword = storePassword
            }
        }
    }

    defaultConfig {
        applicationId = "app.w3dev.ludo"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        manifestPlaceholders["admobAppId"] = admobAppId
    }

    buildTypes {
        debug {
            if (gameEnvironment == "staging") {
                applicationIdSuffix = ".staging"
            } else {
                applicationIdSuffix = ".debug"
            }
        }
        release {
            if (gameEnvironment == "debug") {
                applicationIdSuffix = ".debug"
                signingConfig = signingConfigs.getByName("debug")
            } else if (gameEnvironment == "staging") {
                applicationIdSuffix = ".staging"
                signingConfig = signingConfigs.getByName("debug")
            } else {
                signingConfig = signingConfigs.getByName("gamesRelease")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
