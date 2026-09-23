package app.w3dev.mergerelay

import android.content.Intent
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    private var playGamesBridge: MergeRelayPlayGamesBridge? = null
    private var secureStorageBridge: MergeRelaySecureStorageBridge? = null
    private var challengeLinkBridge: MergeRelayChallengeLinkBridge? = null
    private var shareBridge: MergeRelayShareBridge? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        playGamesBridge = MergeRelayPlayGamesBridge(
            this,
            flutterEngine.dartExecutor.binaryMessenger,
        ).also { bridge -> bridge.register() }
        secureStorageBridge = MergeRelaySecureStorageBridge(
            this,
            flutterEngine.dartExecutor.binaryMessenger,
        ).also { bridge -> bridge.register() }
        challengeLinkBridge = MergeRelayChallengeLinkBridge(
            this,
            flutterEngine.dartExecutor.binaryMessenger,
        ).also { bridge -> bridge.register() }
        shareBridge = MergeRelayShareBridge(
            this,
            flutterEngine.dartExecutor.binaryMessenger,
        ).also { bridge -> bridge.register() }
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        playGamesBridge?.dispose()
        playGamesBridge = null
        secureStorageBridge?.dispose()
        secureStorageBridge = null
        challengeLinkBridge?.dispose()
        challengeLinkBridge = null
        shareBridge?.dispose()
        shareBridge = null
        super.cleanUpFlutterEngine(flutterEngine)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        challengeLinkBridge?.onNewIntent(intent)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        playGamesBridge?.onActivityResult(requestCode, resultCode)
        super.onActivityResult(requestCode, resultCode, data)
    }
}
