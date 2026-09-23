package app.w3dev.mergerelay

import java.util.ArrayDeque

class MergeRelayChallengeLinkQueue(
    private val isSupported: (String) -> Boolean,
    private val onReadyLink: (String) -> Unit,
    private val maxPendingLinks: Int = 8,
) {
    private val pendingLinks = ArrayDeque<String>()
    private var active = false
    private var ready = false

    fun register() {
        active = true
        ready = false
    }

    fun isActive(): Boolean = active

    fun dispose() {
        active = false
        ready = false
        pendingLinks.clear()
    }

    fun accept(raw: String?) {
        if (!active || raw == null || !isSupported(raw)) return
        if (ready) {
            onReadyLink(raw)
            return
        }
        if (pendingLinks.size == maxPendingLinks) pendingLinks.removeFirst()
        pendingLinks.addLast(raw)
    }

    fun takePending(): List<String> {
        if (!active) return emptyList()
        ready = true
        return pendingLinks.toList().also { pendingLinks.clear() }
    }
}
