package app.w3dev.mergerelay

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MergeRelayPlayGamesStateTest {
    @Test
    fun authenticatedStateDoesNotExposeIdentity() {
        val state = MergeRelayPlayGamesState(MergeRelayPlayGamesStatus.AUTHENTICATED)

        assertEquals(mapOf("status" to "authenticated"), state.toMap())
        assertFalse(state.toMap().containsKey("player_id"))
    }

    @Test
    fun serverAccessCanBeGrantedWithoutPlayerIdentity() {
        val access = MergeRelayPlayGamesServerAccess(
            granted = true,
            authCode = "opaque-code",
        )

        assertTrue(access.toMap()["granted"] as Boolean)
        assertEquals("opaque-code", access.toMap()["server_auth_code"])
        assertNull(access.toMap()["player_id"])
    }

    @Test
    fun unavailableConfigIsRepresentedWithoutFakeAuth() {
        val access = MergeRelayPlayGamesServerAccess(
            granted = false,
            diagnosticCode = "server_client_id_missing",
        )

        assertEquals(false, access.toMap()["granted"])
        assertEquals("server_client_id_missing", access.toMap()["diagnostic_code"])
        assertNull(access.toMap()["server_auth_code"])
    }
}
