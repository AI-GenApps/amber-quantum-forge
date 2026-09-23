package app.w3dev.mergerelay

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MergeRelayPlayGamesConfigurationTest {
    @Test
    fun missingApplicationIdDisablesSdkFeatures() {
        val configuration = MergeRelayPlayGamesConfiguration(
            applicationId = "",
            serverClientId = "",
            achievementId = "achievement",
            leaderboardId = "leaderboard",
        )

        assertFalse(configuration.isApplicationConfigured)
    }

    @Test
    fun configuredFeatureIdsAreAcceptedWithoutInventedDefaults() {
        val configuration = MergeRelayPlayGamesConfiguration(
            applicationId = "1234567890",
            serverClientId = "",
            achievementId = "CgkI-example-achievement",
            leaderboardId = "CgkI-example-leaderboard",
        )

        assertTrue(configuration.isApplicationConfigured)
        assertEquals(
            "CgkI-example-achievement",
            configuration.resourceId(MergeRelayPlayGamesFeature.ACHIEVEMENTS),
        )
        assertEquals(
            "CgkI-example-leaderboard",
            configuration.resourceId(MergeRelayPlayGamesFeature.LEADERBOARD),
        )
    }

    @Test
    fun missingAndMalformedFeatureIdsAreUnavailable() {
        val configuration = MergeRelayPlayGamesConfiguration(
            applicationId = "1234567890",
            serverClientId = "",
            achievementId = "",
            leaderboardId = "has whitespace",
        )

        assertEquals(
            "feature_id_missing",
            configuration.resourceIdDiagnostic(MergeRelayPlayGamesFeature.ACHIEVEMENTS),
        )
        assertEquals(
            "feature_id_invalid",
            configuration.resourceIdDiagnostic(MergeRelayPlayGamesFeature.LEADERBOARD),
        )
        assertNull(configuration.resourceId(MergeRelayPlayGamesFeature.LEADERBOARD))
    }

    @Test
    fun actionResultsExposeOnlyBoundedStatusAndDiagnostic() {
        val result = MergeRelayPlayGamesActionResult(
            MergeRelayPlayGamesActionStatus.CANCELLED,
            "user_cancelled",
        )

        assertEquals(
            mapOf("status" to "cancelled", "diagnostic_code" to "user_cancelled"),
            result.toMap(),
        )
    }
}
