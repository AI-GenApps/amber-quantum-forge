package app.w3dev.mergerelay

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MergeRelayChallengeLinkSpecTest {
    @Test
    fun acceptsCustomSchemeWithoutQueryOrFragment() {
        assertEquals(
            "ch_123",
            MergeRelayChallengeLinkSpec.id("mergerelay://challenge/ch_123", null, "debug"),
        )
        assertNull(
            MergeRelayChallengeLinkSpec.id(
                "mergerelay://challenge/ch_123?x=1",
                null,
                "debug",
            ),
        )
        assertNull(
            MergeRelayChallengeLinkSpec.id(
                "mergerelay://user@challenge/ch_123",
                null,
                "debug",
            ),
        )
    }

    @Test
    fun acceptsOnlyTheConfiguredHttpsOrigin() {
        val origin = "https://relay.example"

        assertEquals(
            "ch_123",
            MergeRelayChallengeLinkSpec.id(
                "https://relay.example/games/merge-relay/challenges/ch_123?environment=debug",
                origin,
                "debug",
            ),
        )
        assertEquals(
            "ch_123",
            MergeRelayChallengeLinkSpec.id(
                "https://relay.example/games/merge-relay/challenges/ch_123?environment=debug",
                "https://relay.example/",
                "debug",
            ),
        )
        assertNull(
            MergeRelayChallengeLinkSpec.id(
                "https://other.example/games/merge-relay/challenges/ch_123",
                origin,
                "debug",
            ),
        )
    }

    @Test
    fun rejectsCrossEnvironmentAndAdditionalHttpsQueryValues() {
        val origin = "https://relay.example"

        assertEquals(
            "ch_123",
            MergeRelayChallengeLinkSpec.id(
                "https://relay.example/games/merge-relay/challenges/ch_123?environment=staging",
                origin,
                "staging",
            ),
        )
        assertNull(
            MergeRelayChallengeLinkSpec.id(
                "https://relay.example/games/merge-relay/challenges/ch_123?environment=production",
                origin,
                "staging",
            ),
        )
        assertNull(
            MergeRelayChallengeLinkSpec.id(
                "https://relay.example/games/merge-relay/challenges/ch_123?environment=staging&x=1",
                origin,
                "staging",
            ),
        )
    }

    @Test
    fun rejectsMalformedIdentifiers() {
        assertNull(
            MergeRelayChallengeLinkSpec.id("mergerelay://challenge/ch.123", null, "debug"),
        )
    }
}
