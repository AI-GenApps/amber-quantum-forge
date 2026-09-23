package app.w3dev.mergerelay

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class MergeRelaySecureStorageBridge(
    context: Context,
    messenger: BinaryMessenger,
) {
    companion object {
        const val channelName = "app.w3dev.mergerelay/secure_storage"
        private const val preferencesName = "merge_relay_secure_auth"
        private const val keyAlias = "merge_relay_auth_v1"
        private const val separator = ":"
        private val allowedKeys = setOf("access_token", "recovery_token")
    }

    private val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    private val channel = MethodChannel(messenger, channelName)
    private val workQueue = MergeRelayAsyncWorkQueue(
        dispatch = { work -> android.os.Handler(android.os.Looper.getMainLooper()).post(work) },
    )

    fun register() {
        workQueue.register()
        channel.setMethodCallHandler(::handleCall)
    }

    fun dispose() {
        channel.setMethodCallHandler(null)
        workQueue.dispose { token ->
            val result = token as MethodChannel.Result
            result.error("bridge_disposed", "Secure storage bridge was disposed", null)
        }
    }

    private fun handleCall(call: MethodCall, result: MethodChannel.Result) {
        if (!workQueue.isActive()) {
            result.error("bridge_disposed", "Secure storage bridge is unavailable", null)
            return
        }
        val key = call.argument<String>("key")
        if (key == null || key !in allowedKeys) {
            result.error("invalid_key", "Secure storage key is invalid", null)
            return
        }
        if (call.method != "read" && call.method != "write") {
            result.notImplemented()
            return
        }
        val value = call.argument<String>("value")
        if (!workQueue.submit(
                result,
                work = {
                    if (call.method == "read") read(key) else {
                        write(key, value)
                        null
                    }
                },
                onSuccess = { readValue -> result.success(readValue) },
                onFailure = {
                    result.error("secure_storage_failed", "Secure storage operation failed", null)
                },
            )) {
            result.error("bridge_disposed", "Secure storage bridge is unavailable", null)
        }
    }

    private fun read(key: String): String? {
        val encoded = preferences.getString(key, null) ?: return null
        return decrypt(encoded)
    }

    private fun write(key: String, value: String?) {
        if (value.isNullOrEmpty()) {
            check(preferences.edit().remove(key).commit())
            return
        }
        check(preferences.edit().putString(key, encrypt(value)).commit())
    }

    private fun encrypt(value: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        val encrypted = cipher.doFinal(value.toByteArray(StandardCharsets.UTF_8))
        return listOf(
            Base64.encodeToString(cipher.iv, Base64.NO_WRAP),
            Base64.encodeToString(encrypted, Base64.NO_WRAP),
        ).joinToString(separator)
    }

    private fun decrypt(value: String): String {
        val pieces = value.split(separator)
        if (pieces.size != 2) throw IllegalArgumentException("Invalid secure value")
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(
            Cipher.DECRYPT_MODE,
            key(),
            GCMParameterSpec(128, Base64.decode(pieces[0], Base64.DEFAULT)),
        )
        return String(cipher.doFinal(Base64.decode(pieces[1], Base64.DEFAULT)), StandardCharsets.UTF_8)
    }

    private fun key(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val existing = keyStore.getKey(keyAlias, null)
        if (existing is SecretKey) return existing
        val generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore",
        )
        generator.init(
            KeyGenParameterSpec.Builder(
                keyAlias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

}
