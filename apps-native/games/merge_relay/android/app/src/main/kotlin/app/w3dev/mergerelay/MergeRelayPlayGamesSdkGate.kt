package app.w3dev.mergerelay

class MergeRelayPlayGamesSdkGate(
    private val applicationConfigured: Boolean,
    private val initialize: () -> Unit,
) {
    private var initialized = false

    fun ensure(): MergeRelayPlayGamesState? {
        if (!applicationConfigured) {
            return MergeRelayPlayGamesState(
                MergeRelayPlayGamesStatus.UNAVAILABLE,
                "application_id_missing",
            )
        }
        if (initialized) return null
        return try {
            initialize()
            initialized = true
            null
        } catch (_: Exception) {
            MergeRelayPlayGamesState(
                MergeRelayPlayGamesStatus.ERROR,
                "sdk_initialization_failed",
            )
        }
    }
}
