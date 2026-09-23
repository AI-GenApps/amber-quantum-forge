package app.w3dev.mergerelay

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MergeRelayShareBridge(
    private val activity: Activity,
    messenger: BinaryMessenger,
) {
    companion object {
        const val channelName = "app.w3dev.mergerelay/share"
        private const val shareUnavailable = "share_unavailable"
        private const val shareFailed = "share_failed"
    }

    private val channel = MethodChannel(messenger, channelName)
    private var active = false

    fun register() {
        active = true
        channel.setMethodCallHandler(::handleCall)
    }

    fun dispose() {
        active = false
        channel.setMethodCallHandler(null)
    }

    private fun handleCall(call: MethodCall, result: MethodChannel.Result) {
        if (!active) {
            result.error("bridge_disposed", "Share bridge is unavailable", null)
            return
        }
        if (call.method != "share") {
            result.notImplemented()
            return
        }
        val content = MergeRelayShareContentFactory.create(
            call.argument("title"),
            call.argument("message"),
        )
        if (content == null) {
            result.success(status("failed", "invalid_payload"))
            return
        }
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, content.message)
            putExtra(Intent.EXTRA_TITLE, content.title)
        }
        try {
            activity.startActivity(Intent.createChooser(intent, content.title))
            result.success(status("opened"))
        } catch (_: ActivityNotFoundException) {
            result.success(status("unavailable", shareUnavailable))
        } catch (_: Exception) {
            result.success(status("failed", shareFailed))
        }
    }

    private fun status(status: String, diagnosticCode: String? = null): Map<String, String> {
        val value = mutableMapOf("status" to status)
        if (diagnosticCode != null) value["diagnostic_code"] = diagnosticCode
        return value
    }
}
