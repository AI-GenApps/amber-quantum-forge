package app.w3dev.mergerelay

import android.app.Activity
import android.content.Intent
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import io.flutter.plugin.common.MethodChannel

class MergeRelayPlayGamesActions(
    private val activity: MergeRelayPlayGamesActivityHost,
    private val configuration: MergeRelayPlayGamesConfiguration,
    private val sdk: MergeRelayPlayGamesSdk,
    private val ensureSdk: (MethodChannel.Result) -> Boolean,
    private val cancelledResultCode: Int = Activity.RESULT_CANCELED,
    private val successfulResultCode: Int = Activity.RESULT_OK,
) {
    private val pendingResults = mutableSetOf<MethodChannel.Result>()
    private val pendingActivities = mutableMapOf<Int, MethodChannel.Result>()
    private var nextRequestCode = 0x4D52
    private var active = false

    fun register() {
        active = true
    }

    fun dispose() {
        active = false
        val pending = pendingResults.toList()
        pendingResults.clear()
        pendingActivities.clear()
        pending.forEach { result ->
            result.error("bridge_disposed", "Play Games bridge was disposed", null)
        }
    }

    fun showAchievements(result: MethodChannel.Result) {
        showFeature(MergeRelayPlayGamesFeature.ACHIEVEMENTS, result)
    }

    fun showLeaderboards(result: MethodChannel.Result) {
        showFeature(MergeRelayPlayGamesFeature.LEADERBOARD, result)
    }

    fun onActivityResult(requestCode: Int, resultCode: Int) {
        val result = pendingActivities.remove(requestCode) ?: return
        if (!complete(result)) return
        val actionResult = when (resultCode) {
            cancelledResultCode -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.CANCELLED,
                "user_cancelled",
            )
            successfulResultCode -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.COMPLETED,
            )
            else -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.ERROR,
                "unknown_result_code",
            )
        }
        result.success(actionResult.toMap())
    }

    private fun showFeature(
        feature: MergeRelayPlayGamesFeature,
        result: MethodChannel.Result,
    ) {
        if (!ensureSdk(result)) return
        val diagnostic = configuration.resourceIdDiagnostic(feature)
        if (diagnostic != null) {
            result.success(
                MergeRelayPlayGamesActionResult(
                    MergeRelayPlayGamesActionStatus.UNAVAILABLE,
                    diagnostic,
                ).toMap(),
            )
            return
        }
        if (!track(result)) return
        val authenticated = try {
            sdk.authenticationTask()
        } catch (exception: Exception) {
            finishFailure(result, exception)
            return
        }
        try {
            authenticated.addOnCompleteListener { completed ->
                if (!isPending(result)) return@addOnCompleteListener
                if (!completed.isSuccessful) {
                    finishFailure(result, completed.exception)
                    return@addOnCompleteListener
                }
                if (completed.result != true) {
                    finish(
                        result,
                        MergeRelayPlayGamesActionResult(
                            MergeRelayPlayGamesActionStatus.DECLINED,
                            "sign_in_required",
                        ),
                    )
                    return@addOnCompleteListener
                }
                requestIntent(feature, result)
            }
        } catch (exception: Exception) {
            finishFailure(result, exception)
        }
    }

    private fun requestIntent(
        feature: MergeRelayPlayGamesFeature,
        result: MethodChannel.Result,
    ) {
        val id = configuration.resourceId(feature) ?: run {
            finish(
                result,
                MergeRelayPlayGamesActionResult(
                    MergeRelayPlayGamesActionStatus.UNAVAILABLE,
                    configuration.resourceIdDiagnostic(feature),
                ),
            )
            return
        }
        val intentTask: MergeRelayPlayGamesTask<Intent> = try {
            when (feature) {
                MergeRelayPlayGamesFeature.ACHIEVEMENTS ->
                    sdk.achievementsIntentTask()
                MergeRelayPlayGamesFeature.LEADERBOARD ->
                    sdk.leaderboardIntentTask(id)
            }
        } catch (exception: Exception) {
            finishFailure(result, exception)
            return
        }
        try {
            intentTask.addOnCompleteListener { completed ->
                if (!isPending(result)) return@addOnCompleteListener
                val intent = completed.result
                if (!completed.isSuccessful || intent == null) {
                    finishFailure(result, completed.exception)
                    return@addOnCompleteListener
                }
                val requestCode = allocateRequestCode()
                pendingActivities[requestCode] = result
                try {
                    activity.startActivityForResult(intent, requestCode)
                } catch (exception: Exception) {
                    pendingActivities.remove(requestCode)
                    finishFailure(result, exception)
                }
            }
        } catch (exception: Exception) {
            finishFailure(result, exception)
        }
    }

    private fun allocateRequestCode(): Int {
        var candidate = nextRequestCode and 0xFFFF
        while (pendingActivities.containsKey(candidate)) {
            candidate = (candidate + 1) and 0xFFFF
        }
        nextRequestCode = (candidate + 1) and 0xFFFF
        return candidate
    }

    private fun finishFailure(result: MethodChannel.Result, exception: Exception?) {
        val code = (exception as? ApiException)?.statusCode
        val actionResult = when (code) {
            CommonStatusCodes.CANCELED -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.CANCELLED,
                "user_cancelled",
            )
            CommonStatusCodes.NETWORK_ERROR,
            CommonStatusCodes.TIMEOUT -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.OFFLINE,
                "network_unavailable",
            )
            CommonStatusCodes.SIGN_IN_REQUIRED -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.DECLINED,
                "sign_in_required",
            )
            else -> MergeRelayPlayGamesActionResult(
                MergeRelayPlayGamesActionStatus.ERROR,
                "play_games_error",
            )
        }
        finish(result, actionResult)
    }

    private fun track(result: MethodChannel.Result): Boolean {
        if (!active) {
            result.error("bridge_disposed", "Play Games bridge is unavailable", null)
            return false
        }
        pendingResults.add(result)
        return true
    }

    private fun isPending(result: MethodChannel.Result): Boolean =
        active && pendingResults.contains(result)

    private fun complete(result: MethodChannel.Result): Boolean =
        pendingResults.remove(result) && active

    private fun finish(
        result: MethodChannel.Result,
        actionResult: MergeRelayPlayGamesActionResult,
    ) {
        if (!complete(result)) return
        result.success(actionResult.toMap())
    }
}
