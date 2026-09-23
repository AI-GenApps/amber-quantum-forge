import java.net.URI

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val gameEnvironment = project.findProperty("gameEnvironment")?.toString() ?: "debug"
if (gameEnvironment !in setOf("debug", "staging", "production")) throw GradleException("Unsupported gameEnvironment: $gameEnvironment")
val mergeRelayDebugPackageSuffix = project.findProperty("mergeRelayDebugPackageSuffix")
    ?.toString()
    ?.trim()
    .orEmpty()
if (mergeRelayDebugPackageSuffix.isNotEmpty() && gameEnvironment != "debug") {
    throw GradleException("mergeRelayDebugPackageSuffix is only valid for the debug environment")
}
if (mergeRelayDebugPackageSuffix.isNotEmpty() &&
    !Regex("[a-z][a-z0-9]{0,7}").matches(mergeRelayDebugPackageSuffix)) {
    throw GradleException("mergeRelayDebugPackageSuffix must be 1-8 lowercase ASCII characters")
}
gradle.taskGraph.whenReady {
    if (mergeRelayDebugPackageSuffix.isNotEmpty() &&
        gradle.startParameter.taskNames.any {
            it.contains("Release", ignoreCase = true) ||
                it.contains("Profile", ignoreCase = true)
        }) {
        throw GradleException("mergeRelayDebugPackageSuffix is only valid for debug builds")
    }
}
val mergeRelayPgsPropertyEnvironment = when (gameEnvironment) {
    "debug" -> "Debug"
    "staging" -> "Staging"
    else -> "Production"
}
fun mergeRelayPgsValue(environmentSuffix: String, propertySuffix: String): String =
    System.getenv("MERGE_RELAY_PGS_${gameEnvironment.uppercase()}_$environmentSuffix")
        ?: project.findProperty("mergeRelayPgs${mergeRelayPgsPropertyEnvironment}$propertySuffix")?.toString()
        ?: ""
val androidKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
val androidKeystoreAlias = System.getenv("ANDROID_KEY_ALIAS")
val androidKeystorePassword = System.getenv("ANDROID_KEY_PASSWORD")
val androidStorePassword = System.getenv("ANDROID_STORE_PASSWORD")
val mergeRelayPublicOrigin = System.getenv("MERGE_RELAY_PUBLIC_ORIGIN")
    ?: project.findProperty("mergeRelayPublicOrigin")?.toString()
    ?: ""
val mergeRelayPublicOriginUri = if (mergeRelayPublicOrigin.isBlank()) {
    null
} else {
    URI(mergeRelayPublicOrigin)
}
if (mergeRelayPublicOriginUri != null &&
    (mergeRelayPublicOriginUri.scheme != "https" ||
        mergeRelayPublicOriginUri.host.isNullOrBlank() ||
        mergeRelayPublicOriginUri.userInfo != null ||
        mergeRelayPublicOriginUri.port != -1 ||
        mergeRelayPublicOriginUri.path != "" && mergeRelayPublicOriginUri.path != "/" ||
        mergeRelayPublicOriginUri.query != null ||
        mergeRelayPublicOriginUri.fragment != null)) {
    throw GradleException("MERGE_RELAY_PUBLIC_ORIGIN must be an HTTPS origin without a path or query")
}

android {
    namespace = "app.w3dev.mergerelay"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    buildFeatures {
        buildConfig = true
    }

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
        applicationId = "app.w3dev.mergerelay"
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
        val serverClientId = mergeRelayPgsValue("SERVER_CLIENT_ID", "ServerClientId")
        val applicationId = mergeRelayPgsValue("APPLICATION_ID", "ApplicationId")
        val achievementId = mergeRelayPgsValue("ACHIEVEMENT_ID", "AchievementId")
        val leaderboardId = mergeRelayPgsValue("LEADERBOARD_ID", "LeaderboardId")
        manifestPlaceholders["mergeRelayPgsApplicationId"] = applicationId
        manifestPlaceholders["mergeRelayAppLabel"] =
            if (mergeRelayDebugPackageSuffix.isEmpty()) "Merge Relay" else "Merge Relay QA"
        manifestPlaceholders["mergeRelayPublicHost"] = mergeRelayPublicOriginUri?.host ?: ""
        buildConfigField(
            "String",
            "MERGE_RELAY_PUBLIC_ORIGIN",
            "\"${mergeRelayPublicOrigin.replace("\\", "\\\\").replace("\"", "\\\"")}\"",
        )
        buildConfigField(
            "String",
            "MERGE_RELAY_ENVIRONMENT",
            "\"${gameEnvironment}\"",
        )
        buildConfigField(
            "String",
            "MERGE_RELAY_PGS_SERVER_CLIENT_ID",
            "\"${serverClientId.replace("\\", "\\\\").replace("\"", "\\\"")}\"",
        )
        buildConfigField(
            "String",
            "MERGE_RELAY_PGS_APPLICATION_ID",
            "\"${applicationId.replace("\\", "\\\\").replace("\"", "\\\"")}\"",
        )
        buildConfigField(
            "String",
            "MERGE_RELAY_PGS_ACHIEVEMENT_ID",
            "\"${achievementId.replace("\\", "\\\\").replace("\"", "\\\"")}\"",
        )
        buildConfigField(
            "String",
            "MERGE_RELAY_PGS_LEADERBOARD_ID",
            "\"${leaderboardId.replace("\\", "\\\\").replace("\"", "\\\"")}\"",
        )
    }

    buildTypes {
        debug {
            if (gameEnvironment == "staging") {
                applicationIdSuffix = ".staging"
            } else {
                applicationIdSuffix = ".debug${if (mergeRelayDebugPackageSuffix.isEmpty()) "" else ".$mergeRelayDebugPackageSuffix"}"
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

dependencies {
    implementation("com.google.android.gms:play-services-games-v2:22.1.0")
    testImplementation("junit:junit:4.13.2")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
