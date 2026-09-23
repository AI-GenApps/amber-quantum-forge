package app.w3dev.mergerelay

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MergeRelayShareContentTest {
    @Test
    fun createsTextShareContent() {
        val content = MergeRelayShareContentFactory.create(
            "Merge Relay",
            " Join Ada: ch_123 ",
        )

        assertEquals("Merge Relay", content?.title)
        assertEquals("Join Ada: ch_123", content?.message)
    }

    @Test
    fun rejectsBlankMessage() {
        assertNull(MergeRelayShareContentFactory.create("Merge Relay", "  "))
    }
}
