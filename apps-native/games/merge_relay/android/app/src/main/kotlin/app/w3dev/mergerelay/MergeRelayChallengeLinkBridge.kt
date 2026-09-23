package app.w3dev.mergerelay

import android.app.Activity
import android.content.Intent
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MergeRelayChallengeLinkBridge(
    private val activity: Activity,
    messenger: BinaryMessenger,
) {
    companion object {
        const val channelName = "app.w3dev.mergerelay/challenge_links"
        private const val linkEvent = "link_received"
        private const val takePendingLinks = "take_pending_links"
        private const val maxPendingLinks = 8
    }

    private val channel = MethodChannel(messenger, channelName)
    private val configuredOrigin = configuredOrigin()
    private val configuredEnvironment = BuildConfig.MERGE_RELAY_ENVIRONMENT
    private val linkQueue = MergeRelayChallengeLinkQueue(
        isSupported = ::isSupported,
        onReadyLink = { raw -> channel.invokeMethod(linkEvent, raw) },
        maxPendingLinks = maxPendingLinks,
    )

    fun register() {
        linkQueue.register()
        channel.setMethodCallHandler(::handleCall)
        linkQueue.accept(activity.intent?.data?.toString())
    }

    fun dispose() {
        linkQueue.dispose()
        channel.setMethodCallHandler(null)
    }

    fun onNewIntent(intent: Intent) {
        linkQueue.accept(intent.data?.toString())
    }

    private fun handleCall(call: MethodCall, result: MethodChannel.Result) {
        if (!linkQueue.isActive()) {
            result.error("bridge_disposed", "Challenge link bridge is unavailable", null)
            return
        }
        if (call.method != takePendingLinks) {
            result.notImplemented()
            return
        }
        result.success(linkQueue.takePending())
    }

    private fun isSupported(raw: String): Boolean {
        return MergeRelayChallengeLinkSpec.id(raw, configuredOrigin, configuredEnvironment) != null
    }

    private fun configuredOrigin(): String? {
        val value = BuildConfig.MERGE_RELAY_PUBLIC_ORIGIN.trim()
        return value.takeIf(MergeRelayChallengeLinkSpec::isHttpsOrigin)
    }
}
