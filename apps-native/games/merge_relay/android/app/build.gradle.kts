import com.android.build.api.artifact.SingleArtifact
import java.net.URI
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.transform.OutputKeys
import javax.xml.transform.TransformerFactory
import javax.xml.transform.dom.DOMSource
import javax.xml.transform.stream.StreamResult

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

/**
 * Adds the two manifest entries that must only exist when a real value is configured, to the
 * MERGED manifest (a manifest placeholder can change an attribute value but cannot omit an
 * element, and an empty value would ship as an invalid declaration):
 *
 * - `com.google.android.gms.games.APP_ID` meta-data, only when a numeric Play Games application
 *   id is configured. The value is a `@string/` reference because aapt2 stores a plain numeric
 *   literal of up to 10 digits as an integer, which `Bundle.getString` (what the Play Games SDK
 *   calls) does not return.
 * - The https App Link intent-filter on MainActivity, only when MERGE_RELAY_PUBLIC_ORIGIN names
 *   a valid https origin.
 *
 * Blank input leaves the merged manifest byte-for-byte unchanged in meaning: nothing is added.
 */
abstract class MergeRelayManifestConditionalsTask : DefaultTask() {
    @get:InputFile
    @get:PathSensitive(PathSensitivity.NONE)
    abstract val mergedManifest: RegularFileProperty

    @get:OutputFile
    abstract val updatedManifest: RegularFileProperty

    @get:Input
    abstract val pgsApplicationId: Property<String>

    @get:Input
    abstract val publicHost: Property<String>

    @TaskAction
    fun apply() {
        val androidNs = "http://schemas.android.com/apk/res/android"
        val factory = DocumentBuilderFactory.newInstance()
        factory.isNamespaceAware = true
        val document = factory.newDocumentBuilder().parse(mergedManifest.get().asFile)
        val application = document.getElementsByTagName("application").item(0)
            ?: throw GradleException("merged manifest has no <application>")
        if (pgsApplicationId.get().isNotBlank()) {
            val meta = document.createElement("meta-data")
            meta.setAttributeNS(androidNs, "android:name", "com.google.android.gms.games.APP_ID")
            meta.setAttributeNS(androidNs, "android:value", "@string/merge_relay_pgs_application_id")
            application.appendChild(meta)
        }
        if (publicHost.get().isNotBlank()) {
            val activities = document.getElementsByTagName("activity")
            val main = (0 until activities.length)
                .map { activities.item(it) as org.w3c.dom.Element }
                .firstOrNull { it.getAttributeNS(androidNs, "name").endsWith(".MainActivity") }
                ?: throw GradleException("merged manifest has no MainActivity")
            fun child(tag: String, name: String): org.w3c.dom.Element =
                document.createElement(tag).also { it.setAttributeNS(androidNs, "android:name", name) }
            val filter = document.createElement("intent-filter")
            filter.appendChild(child("action", "android.intent.action.VIEW"))
            filter.appendChild(child("category", "android.intent.category.DEFAULT"))
            filter.appendChild(child("category", "android.intent.category.BROWSABLE"))
            val data = document.createElement("data")
            data.setAttributeNS(androidNs, "android:scheme", "https")
            data.setAttributeNS(androidNs, "android:host", publicHost.get())
            data.setAttributeNS(androidNs, "android:pathPrefix", "/games/merge-relay/challenges")
            filter.appendChild(data)
            main.appendChild(filter)
        }
        val transformer = TransformerFactory.newInstance().newTransformer()
        transformer.setOutputProperty(OutputKeys.ENCODING, "utf-8")
        transformer.transform(DOMSource(document), StreamResult(updatedManifest.get().asFile))
    }
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
// Blank means "no Play Games project configured": the APP_ID meta-data is then not emitted at all
// (see MergeRelayManifestConditionalsTask). A real id comes from Play Console > Play Games
// Services > Setup and management > Configuration; it is numeric (the project id).
val mergeRelayPgsApplicationId = mergeRelayPgsValue("APPLICATION_ID", "ApplicationId").trim()
if (mergeRelayPgsApplicationId.isNotEmpty() && !Regex("[0-9]{1,20}").matches(mergeRelayPgsApplicationId)) {
    throw GradleException("The Play Games application id must be numeric (the Play Console project id)")
}
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
        resValues = true
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
        val applicationId = mergeRelayPgsApplicationId
        val achievementId = mergeRelayPgsValue("ACHIEVEMENT_ID", "AchievementId")
        val leaderboardId = mergeRelayPgsValue("LEADERBOARD_ID", "LeaderboardId")
        if (applicationId.isNotEmpty()) {
            resValue("string", "merge_relay_pgs_application_id", applicationId)
        }
        manifestPlaceholders["mergeRelayAppLabel"] =
            if (mergeRelayDebugPackageSuffix.isEmpty()) "Glow Rescue" else "Glow Rescue QA"
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
                applicationIdSuffix = ".debug"
                if (mergeRelayDebugPackageSuffix.isNotEmpty()) {
                    applicationIdSuffix = ".debug.$mergeRelayDebugPackageSuffix"
                }
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

androidComponents {
    onVariants { variant ->
        val taskName = "mergeRelay${variant.name.replaceFirstChar { it.uppercase() }}ManifestConditionals"
        val conditionals = tasks.register<MergeRelayManifestConditionalsTask>(taskName) {
            pgsApplicationId.set(mergeRelayPgsApplicationId)
            publicHost.set(mergeRelayPublicOriginUri?.host ?: "")
        }
        variant.artifacts
            .use(conditionals)
            .wiredWithFiles(
                MergeRelayManifestConditionalsTask::mergedManifest,
                MergeRelayManifestConditionalsTask::updatedManifest,
            )
            .toTransform(SingleArtifact.MERGED_MANIFEST)
    }
}

dependencies {
    // Play Games Services v2 stays bundled (owner decision 2026-10-16) but is DORMANT in v1:
    // PlayGamesInitProvider is removed in the manifest and Dart gates every call behind
    // mergeRelaySocialEnabled (false). See tasks/epics/16-games-portfolio-wave2/27-*.md.
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
