package app.w3dev.mergerelay

import android.app.Activity
import android.content.Intent
import io.flutter.plugin.common.MethodChannel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MergeRelayPlayGamesAsyncTest {
    @Test
    fun delayedAuthenticationCompletionAfterDisposeIsIgnored() {
        val authentication = FakeTask<Boolean>()
        val result = RecordingResult()
        val actions = actions(FakeSdk(authentication = authentication))
        actions.register()

        actions.showAchievements(result)
        actions.dispose()
        authentication.complete(true)

        assertEquals(listOf("bridge_disposed"), result.errors)
        assertTrue(result.successes.isEmpty())
    }

    @Test
    fun authenticationFailureReturnsErrorWithoutOpeningUi() {
        val authentication = FakeTask<Boolean>()
        val result = RecordingResult()
        val sdk = FakeSdk(authentication = authentication)
        val actions = actions(sdk)
        actions.register()

        actions.showAchievements(result)
        authentication.fail(IllegalStateException("offline"))

        assertEquals("error", result.successes.single()?.get("status"))
        assertTrue(sdk.startedIntents.isEmpty())
    }

    @Test
    fun delayedIntentCompletionAfterDisposeIsIgnored() {
        val authentication = FakeTask<Boolean>()
        val intentTask = FakeTask<Intent>()
        val result = RecordingResult()
        val sdk = FakeSdk(authentication = authentication, intent = intentTask)
        val actions = actions(sdk)
        actions.register()

        actions.showLeaderboards(result)
        authentication.complete(true)
        actions.dispose()
        intentTask.complete(Intent("merge-relay"))

        assertEquals(listOf("bridge_disposed"), result.errors)
        assertTrue(sdk.startedIntents.isEmpty())
    }

    @Test
    fun activityCancellationCompletesThePendingAction() {
        val authentication = FakeTask<Boolean>()
        val intentTask = FakeTask<Intent>()
        val result = RecordingResult()
        val sdk = FakeSdk(authentication = authentication, intent = intentTask)
        val host = RecordingActivityHost()
        val actions = actions(sdk, host)
        actions.register()

        actions.showLeaderboards(result)
        authentication.complete(true)
        intentTask.complete(Intent("merge-relay"))
        actions.onActivityResult(host.requestCode, 0)

        assertEquals("cancelled", result.successes.single()?.get("status"))
        assertEquals("user_cancelled", result.successes.single()?.get("diagnostic_code"))
    }

    @Test
    fun unknownActivityResultCodeReturnsError() {
        val authentication = FakeTask<Boolean>()
        val intentTask = FakeTask<Intent>()
        val result = RecordingResult()
        val sdk = FakeSdk(authentication = authentication, intent = intentTask)
        val host = RecordingActivityHost()
        val actions = actions(sdk, host)
        actions.register()

        actions.showLeaderboards(result)
        authentication.complete(true)
        intentTask.complete(Intent("merge-relay"))
        actions.onActivityResult(host.requestCode, Activity.RESULT_FIRST_USER)

        assertEquals("error", result.successes.single()?.get("status"))
        assertEquals(
            "unknown_result_code",
            result.successes.single()?.get("diagnostic_code"),
        )
    }

    @Test
    fun taskListenerFailureReturnsErrorAndClearsPendingAction() {
        val authentication = FakeTask<Boolean>().apply {
            listenerFailure = IllegalStateException("listener failed")
        }
        val result = RecordingResult()
        val actions = actions(FakeSdk(authentication = authentication))
        actions.register()

        actions.showAchievements(result)

        assertEquals("error", result.successes.single()?.get("status"))
        actions.dispose()
        assertTrue(result.errors.isEmpty())
    }

    @Test
    fun missingApplicationIdDoesNotInitializeSdk() {
        var initializeCalls = 0
        val gate = MergeRelayPlayGamesSdkGate(false) { initializeCalls += 1 }

        val state = gate.ensure()

        assertEquals(MergeRelayPlayGamesStatus.UNAVAILABLE, state?.status)
        assertEquals(0, initializeCalls)
    }

    @Test
    fun sdkInitializationFailureIsReportedAndCanRetry() {
        var initializeCalls = 0
        val gate = MergeRelayPlayGamesSdkGate(true) {
            initializeCalls += 1
            throw IllegalStateException("init failed")
        }

        val first = gate.ensure()
        val second = gate.ensure()

        assertEquals(MergeRelayPlayGamesStatus.ERROR, first?.status)
        assertEquals(MergeRelayPlayGamesStatus.ERROR, second?.status)
        assertEquals(2, initializeCalls)
    }

    private fun actions(
        sdk: FakeSdk,
        host: RecordingActivityHost = RecordingActivityHost(),
    ) = MergeRelayPlayGamesActions(
        activity = host,
        configuration = MergeRelayPlayGamesConfiguration(
            applicationId = "app-id",
            serverClientId = "server-client-id",
            achievementId = "achievement-id",
            leaderboardId = "leaderboard-id",
        ),
        sdk = sdk,
        ensureSdk = { true },
    )
}

private class FakeSdk(
    private val authentication: FakeTask<Boolean>,
    private val intent: FakeTask<Intent> = FakeTask(),
) : MergeRelayPlayGamesSdk {
    val startedIntents = mutableListOf<Intent>()

    override fun initialize(context: android.content.Context) = Unit

    override fun authenticationTask() = authentication

    override fun signInTask() = authentication

    override fun serverAccessTask(
        serverClientId: String,
        forceRefreshToken: Boolean,
    ) = FakeTask<String>()

    override fun achievementsIntentTask() = intent

    override fun leaderboardIntentTask(leaderboardId: String) = intent
}

private class FakeTask<T> : MergeRelayPlayGamesTask<T> {
    private val listeners = mutableListOf<(MergeRelayPlayGamesTask<T>) -> Unit>()
    var listenerFailure: Exception? = null
    override var isSuccessful: Boolean = false
        private set
    override var result: T? = null
        private set
    override var exception: Exception? = null
        private set

    override fun addOnCompleteListener(listener: (MergeRelayPlayGamesTask<T>) -> Unit) {
        listenerFailure?.let { throw it }
        listeners += listener
    }

    fun complete(value: T) {
        isSuccessful = true
        result = value
        listeners.toList().forEach { it(this) }
    }

    fun fail(error: Exception) {
        exception = error
        listeners.toList().forEach { it(this) }
    }
}

private class RecordingActivityHost : MergeRelayPlayGamesActivityHost {
    var requestCode = -1

    override fun startActivityForResult(intent: Intent, requestCode: Int) {
        this.requestCode = requestCode
    }
}

private class RecordingResult : MethodChannel.Result {
    val successes = mutableListOf<Map<*, *>?>()
    val errors = mutableListOf<String>()

    override fun success(result: Any?) {
        successes += result as? Map<*, *>
    }

    override fun error(errorCode: String, errorMessage: String?, errorDetails: Any?) {
        errors += errorCode
    }

    override fun notImplemented() = Unit
}
