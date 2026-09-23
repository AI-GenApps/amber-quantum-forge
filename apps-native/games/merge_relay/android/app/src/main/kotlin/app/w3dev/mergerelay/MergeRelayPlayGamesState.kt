package app.w3dev.mergerelay

enum class MergeRelayPlayGamesStatus(val wireValue: String) {
    AUTHENTICATED("authenticated"),
    SIGNED_OUT("signed_out"),
    DECLINED("declined"),
    CANCELLED("cancelled"),
    OFFLINE("offline"),
    UNAVAILABLE("unavailable"),
    ERROR("error"),
}

data class MergeRelayPlayGamesState(
    val status: MergeRelayPlayGamesStatus,
    val diagnosticCode: String? = null,
) {
    fun toMap(): Map<String, Any> {
        val values = mutableMapOf<String, Any>("status" to status.wireValue)
        if (diagnosticCode != null) values["diagnostic_code"] = diagnosticCode
        return values
    }
}

data class MergeRelayPlayGamesServerAccess(
    val granted: Boolean,
    val authCode: String? = null,
    val diagnosticCode: String? = null,
) {
    fun toMap(): Map<String, Any> {
        val values = mutableMapOf<String, Any>("granted" to granted)
        if (authCode != null) values["server_auth_code"] = authCode
        if (diagnosticCode != null) values["diagnostic_code"] = diagnosticCode
        return values
    }
}

enum class MergeRelayPlayGamesActionStatus(val wireValue: String) {
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    DECLINED("declined"),
    OFFLINE("offline"),
    UNAVAILABLE("unavailable"),
    ERROR("error"),
}

data class MergeRelayPlayGamesActionResult(
    val status: MergeRelayPlayGamesActionStatus,
    val diagnosticCode: String? = null,
) {
    fun toMap(): Map<String, Any> {
        val values = mutableMapOf<String, Any>("status" to status.wireValue)
        if (diagnosticCode != null) values["diagnostic_code"] = diagnosticCode
        return values
    }
}
