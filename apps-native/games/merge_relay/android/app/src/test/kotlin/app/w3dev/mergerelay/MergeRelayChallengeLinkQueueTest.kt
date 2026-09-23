package app.w3dev.mergerelay

import org.junit.Assert.assertEquals
import org.junit.Test

class MergeRelayChallengeLinkQueueTest {
    @Test
    fun coldLinksWaitForDartAndWarmLinksFollowReadyOrdering() {
        val delivered = mutableListOf<String>()
        val queue = MergeRelayChallengeLinkQueue(
            isSupported = { it.startsWith("mergerelay://") },
            onReadyLink = delivered::add,
            maxPendingLinks = 2,
        )
        queue.register()
        queue.accept("mergerelay://cold-1")
        queue.accept("mergerelay://cold-2")

        assertEquals(
            listOf("mergerelay://cold-1", "mergerelay://cold-2"),
            queue.takePending(),
        )
        queue.accept("mergerelay://warm-1")

        assertEquals(listOf("mergerelay://warm-1"), delivered)
    }

    @Test
    fun queueDropsOldestWhenColdBufferIsFullAndClearsOnDispose() {
        val delivered = mutableListOf<String>()
        val queue = MergeRelayChallengeLinkQueue(
            isSupported = { true },
            onReadyLink = delivered::add,
            maxPendingLinks = 2,
        )
        queue.register()
        queue.accept("first")
        queue.accept("second")
        queue.accept("third")
        queue.dispose()
        queue.accept("late")

        assertEquals(emptyList<String>(), queue.takePending())
        assertEquals(emptyList<String>(), delivered)
    }
}
