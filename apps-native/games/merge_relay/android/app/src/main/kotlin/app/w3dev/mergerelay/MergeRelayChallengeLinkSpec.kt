package app.w3dev.mergerelay

import java.net.URI

object MergeRelayChallengeLinkSpec {
    private val idPattern = Regex("^[A-Za-z0-9_-]{1,128}$")

    fun id(raw: String, configuredOrigin: String?, configuredEnvironment: String): String? {
        val uri = runCatching { URI(raw) }.getOrNull() ?: return null
        if (uri.rawFragment != null || uri.userInfo != null) return null
        val path = uri.rawPath ?: return null
        if (uri.scheme == "mergerelay" && uri.host == "challenge") {
            if (uri.rawQuery != null) return null
            return path.removePrefix("/").takeIf {
                path.startsWith("/") && it.indexOf('/') == -1 && idPattern.matches(it)
            }
        }
        val origin = configuredOrigin?.let { runCatching { URI(it) }.getOrNull() }
        if (origin == null || !isHttpsOrigin(origin) ||
            uri.scheme != origin.scheme || uri.host != origin.host ||
            uri.port != origin.port ||
            path.split('/').size != 5 ||
            path.split('/')[1] != "games" ||
            path.split('/')[2] != "merge-relay" ||
            path.split('/')[3] != "challenges"
        ) {
            return null
        }
        if (!hasMatchingEnvironment(uri.rawQuery, configuredEnvironment)) return null
        return path.split('/')[4].takeIf(idPattern::matches)
    }

    private fun hasMatchingEnvironment(rawQuery: String?, configuredEnvironment: String): Boolean {
        if (rawQuery == null) return false
        val parts = rawQuery.split('&')
        if (parts.size != 1) return false
        val pair = parts.single()
        val separator = pair.indexOf('=')
        return separator > 0 &&
            pair.indexOf('=', separator + 1) == -1 &&
            pair.substring(0, separator) == "environment" &&
            pair.substring(separator + 1) == configuredEnvironment
    }

    fun isHttpsOrigin(raw: String): Boolean {
        val uri = runCatching { URI(raw) }.getOrNull() ?: return false
        return isHttpsOrigin(uri)
    }

    private fun isHttpsOrigin(uri: URI): Boolean =
        uri.scheme == "https" && !uri.host.isNullOrBlank() &&
        uri.userInfo == null && uri.port == -1 &&
            (uri.path.isEmpty() || uri.path == "/") &&
            uri.rawQuery == null && uri.rawFragment == null
}
