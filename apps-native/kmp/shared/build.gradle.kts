import org.jetbrains.kotlin.gradle.plugin.mpp.apple.XCFramework

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.android.kotlin.multiplatform.library)
}

kotlin {
    androidLibrary {
        namespace = "app.w3dev.shared"
        compileSdk = 36
        minSdk = 24
    }

    val framework = XCFramework("StarterShared")

    jvm()

    iosArm64().binaries.framework {
        baseName = "StarterShared"
        isStatic = true
        framework.add(this)
    }

    iosSimulatorArm64().binaries.framework {
        baseName = "StarterShared"
        isStatic = true
        framework.add(this)
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.io.ktor.client.core)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
            implementation(libs.io.ktor.client.mock)
            implementation(libs.kotlinx.coroutines.test)
        }
        androidMain.dependencies {
            implementation(libs.io.ktor.client.okhttp)
        }
        jvmMain.dependencies {
            implementation(libs.io.ktor.client.cio)
        }
        iosMain.dependencies {
            implementation(libs.io.ktor.client.darwin)
        }
    }
}
