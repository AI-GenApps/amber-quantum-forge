package app.w3dev.mergerelay

data class MergeRelayPlayGamesConfiguration(
    val applicationId: String,
    val serverClientId: String,
    val achievementId: String,
    val leaderboardId: String,
) {
    val isApplicationConfigured: Boolean
        get() = applicationId.isNotBlank()

    fun resourceId(kind: MergeRelayPlayGamesFeature): String? {
        val value = when (kind) {
            MergeRelayPlayGamesFeature.ACHIEVEMENTS -> achievementId
            MergeRelayPlayGamesFeature.LEADERBOARD -> leaderboardId
        }
        return value.takeIf(::isValidResourceId)
    }

    fun resourceIdDiagnostic(kind: MergeRelayPlayGamesFeature): String? {
        val value = when (kind) {
            MergeRelayPlayGamesFeature.ACHIEVEMENTS -> achievementId
            MergeRelayPlayGamesFeature.LEADERBOARD -> leaderboardId
        }
        return when {
            value.isBlank() -> "feature_id_missing"
            !isValidResourceId(value) -> "feature_id_invalid"
            else -> null
        }
    }

    companion object {
        fun fromBuildConfig() = MergeRelayPlayGamesConfiguration(
            applicationId = BuildConfig.MERGE_RELAY_PGS_APPLICATION_ID,
            serverClientId = BuildConfig.MERGE_RELAY_PGS_SERVER_CLIENT_ID,
            achievementId = BuildConfig.MERGE_RELAY_PGS_ACHIEVEMENT_ID,
            leaderboardId = BuildConfig.MERGE_RELAY_PGS_LEADERBOARD_ID,
        )

        fun isValidResourceId(value: String): Boolean =
            value.isNotBlank() &&
                value.length <= 256 &&
                value.none { character -> character.isWhitespace() || character.isISOControl() }
    }
}

enum class MergeRelayPlayGamesFeature {
    ACHIEVEMENTS,
    LEADERBOARD,
}
