package app.w3dev.mergerelay

data class MergeRelayShareContent(
    val title: String,
    val message: String,
)

object MergeRelayShareContentFactory {
    fun create(title: String?, message: String?): MergeRelayShareContent? {
        val text = message?.trim()?.takeIf(String::isNotEmpty) ?: return null
        val chooserTitle = title?.trim()?.takeIf(String::isNotEmpty) ?: "Share"
        return MergeRelayShareContent(chooserTitle, text)
    }
}
