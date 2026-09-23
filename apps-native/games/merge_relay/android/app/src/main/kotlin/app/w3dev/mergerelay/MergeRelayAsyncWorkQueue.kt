package app.w3dev.mergerelay

import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class MergeRelayAsyncWorkQueue(
    private val executor: ExecutorService = Executors.newSingleThreadExecutor(),
    private val dispatch: ((() -> Unit) -> Unit) = { work -> work() },
) {
    private val lock = Any()
    private val pending = mutableSetOf<Any>()
    private var active = false

    fun register() {
        synchronized(lock) { active = true }
    }

    fun isActive(): Boolean = synchronized(lock) { active }

    fun <T> submit(
        token: Any,
        work: () -> T,
        onSuccess: (T) -> Unit,
        onFailure: (Exception) -> Unit,
    ): Boolean {
        synchronized(lock) {
            if (!active) return false
            pending.add(token)
        }
        try {
            executor.execute {
                val outcome = try {
                    Result.success(work())
                } catch (exception: Exception) {
                    Result.failure(exception)
                }
                dispatch {
                    if (!take(token)) return@dispatch
                    if (outcome.isSuccess) {
                        onSuccess(outcome.getOrThrow())
                    } else {
                        val failure = outcome.exceptionOrNull() ?: IllegalStateException("Async work failed")
                        onFailure(failure as? Exception ?: RuntimeException(failure))
                    }
                }
            }
        } catch (exception: Exception) {
            dispatch {
                if (take(token)) onFailure(exception)
            }
        }
        return true
    }

    fun dispose(onPending: (Any) -> Unit) {
        val tokens = synchronized(lock) {
            active = false
            pending.toList().also { pending.clear() }
        }
        tokens.forEach(onPending)
        executor.shutdownNow()
    }

    private fun take(token: Any): Boolean = synchronized(lock) {
        active && pending.remove(token)
    }
}
