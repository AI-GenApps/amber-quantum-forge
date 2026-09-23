package app.w3dev.mergerelay

import android.app.Activity
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MergeRelayPlayGamesBridge(
    private val activity: Activity,
    messenger: BinaryMessenger,
    private val configuration: MergeRelayPlayGamesConfiguration =
        MergeRelayPlayGamesConfiguration.fromBuildConfig(),
    private val sdk: MergeRelayPlayGamesSdk = AndroidMergeRelayPlayGamesSdk(activity),
) {
    companion object {
        const val channelName = "app.w3dev.mergerelay/play_games"
    }

    private val channel = MethodChannel(messenger, channelName)
    private val pendingResults = mutableSetOf<MethodChannel.Result>()
    private val sdkGate = MergeRelayPlayGamesSdkGate(
        applicationConfigured = configuration.isApplicationConfigured,
        initialize = { sdk.initialize(activity) },
    )
    private val actions = MergeRelayPlayGamesActions(
        activity = MergeRelayPlayGamesActivityHost { intent, requestCode ->
            activity.startActivityForResult(intent, requestCode)
        },
        configuration = configuration,
        sdk = sdk,
        ensureSdk = ::ensureSdkInitialized,
        cancelledResultCode = Activity.RESULT_CANCELED,
    )
    private var active = false

    fun register() {
        active = true
        actions.register()
        channel.setMethodCallHandler(::handleCall)
    }

    fun dispose() {
        active = false
        actions.dispose()
        channel.setMethodCallHandler(null)
        val pending = pendingResults.toList()
        pendingResults.clear()
        pending.forEach { result ->
            result.error("bridge_disposed", "Play Games bridge was disposed", null)
        }
    }

    private fun handleCall(call: MethodCall, result: MethodChannel.Result) {
        if (!active) {
            result.error("bridge_disposed", "Play Games bridge is unavailable", null)
            return
        }
        when (call.method) {
            "initialize" -> initialize(result)
            "sign_in" -> signIn(result)
            "request_server_access" -> requestServerAccess(result)
            "show_achievements" -> actions.showAchievements(result)
            "show_leaderboards" -> actions.showLeaderboards(result)
            else -> result.notImplemented()
        }
    }

    private fun initialize(result: MethodChannel.Result) {
        if (!ensureSdkInitialized(result)) return
        try {
            observeAuthentication(
                sdk.authenticationTask(),
                result,
            )
        } catch (exception: Exception) {
            result.success(failureState(exception).toMap())
        }
    }

    private fun signIn(result: MethodChannel.Result) {
        if (!ensureSdkInitialized(result)) return
        try {
            observeAuthentication(
                sdk.signInTask(),
                result,
            )
        } catch (exception: Exception) {
            result.success(failureState(exception).toMap())
        }
    }

    private fun requestServerAccess(result: MethodChannel.Result) {
        if (!ensureSdkInitialized(result)) return
        val serverClientId = configuration.serverClientId
        if (serverClientId.isBlank()) {
            result.success(
                MergeRelayPlayGamesServerAccess(
                    granted = false,
                    diagnosticCode = "server_client_id_missing",
                ).toMap(),
            )
            return
        }
        try {
            observeServerAccess(
                sdk.serverAccessTask(serverClientId, false),
                result,
            )
        } catch (exception: Exception) {
            result.success(serverAccessFailure(exception).toMap())
        }
    }

    private fun observeAuthentication(
        task: MergeRelayPlayGamesTask<Boolean>,
        result: MethodChannel.Result,
    ) {
        if (!track(result)) return
        try {
            task.addOnCompleteListener { completed ->
                if (!complete(result)) return@addOnCompleteListener
                if (!completed.isSuccessful) {
                    result.success(failureState(completed.exception).toMap())
                    return@addOnCompleteListener
                }
                val state = if (completed.result == true) {
                    MergeRelayPlayGamesState(MergeRelayPlayGamesStatus.AUTHENTICATED)
                } else {
                    MergeRelayPlayGamesState(MergeRelayPlayGamesStatus.SIGNED_OUT)
                }
                result.success(state.toMap())
            }
        } catch (exception: Exception) {
            if (complete(result)) result.success(failureState(exception).toMap())
        }
    }

    private fun observeServerAccess(
        task: MergeRelayPlayGamesTask<String>,
        result: MethodChannel.Result,
    ) {
        if (!track(result)) return
        try {
            task.addOnCompleteListener { completed ->
                if (!complete(result)) return@addOnCompleteListener
                if (!completed.isSuccessful) {
                    result.success(serverAccessFailure(completed.exception).toMap())
                    return@addOnCompleteListener
                }
                val authCode = completed.result
                if (authCode.isNullOrBlank()) {
                    result.success(
                        MergeRelayPlayGamesServerAccess(
                            granted = false,
                            diagnosticCode = "server_access_empty",
                        ).toMap(),
                    )
                    return@addOnCompleteListener
                }
                result.success(
                    MergeRelayPlayGamesServerAccess(
                        granted = true,
                        authCode = authCode,
                    ).toMap(),
                )
            }
        } catch (exception: Exception) {
            if (complete(result)) result.success(serverAccessFailure(exception).toMap())
        }
    }

    private fun track(result: MethodChannel.Result): Boolean {
        if (!active) {
            result.error("bridge_disposed", "Play Games bridge is unavailable", null)
            return false
        }
        pendingResults.add(result)
        return true
    }

    private fun complete(result: MethodChannel.Result): Boolean =
        pendingResults.remove(result) && active

    private fun failureState(exception: Exception?): MergeRelayPlayGamesState {
        val code = statusCode(exception)
        return when (code) {
            CommonStatusCodes.CANCELED -> MergeRelayPlayGamesState(
                MergeRelayPlayGamesStatus.CANCELLED,
                "user_cancelled",
            )
            CommonStatusCodes.NETWORK_ERROR,
            CommonStatusCodes.TIMEOUT -> MergeRelayPlayGamesState(
                MergeRelayPlayGamesStatus.OFFLINE,
                "network_unavailable",
            )
            CommonStatusCodes.SIGN_IN_REQUIRED -> MergeRelayPlayGamesState(
                MergeRelayPlayGamesStatus.DECLINED,
                "sign_in_required",
            )
            else -> MergeRelayPlayGamesState(
                MergeRelayPlayGamesStatus.ERROR,
                "play_games_error",
            )
        }
    }

    private fun serverAccessFailure(
        exception: Exception?,
    ): MergeRelayPlayGamesServerAccess {
        val state = failureState(exception)
        return MergeRelayPlayGamesServerAccess(
            granted = false,
            diagnosticCode = state.diagnosticCode ?: "server_access_failed",
        )
    }

    private fun statusCode(exception: Exception?): Int? =
        (exception as? ApiException)?.statusCode

    private fun ensureSdkInitialized(result: MethodChannel.Result): Boolean {
        val failure = sdkGate.ensure() ?: return true
        result.success(failure.toMap())
        return false
    }

    fun onActivityResult(requestCode: Int, resultCode: Int) {
        actions.onActivityResult(requestCode, resultCode)
    }
}
