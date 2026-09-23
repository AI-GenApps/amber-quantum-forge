package app.w3dev.mergerelay

import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.AbstractExecutorService
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MergeRelayAsyncWorkQueueTest {
    @Test
    fun workerFailureIsDeliveredAsFailure() {
        val queue = MergeRelayAsyncWorkQueue(
            executor = Executors.newSingleThreadExecutor(),
            dispatch = { work -> work() },
        )
        val failure = mutableListOf<String>()
        val completed = CountDownLatch(1)
        queue.register()

        queue.submit(
            token = "read",
            work = { throw IllegalStateException("storage failure") },
            onSuccess = { completed.countDown() },
            onFailure = {
                failure += it.message.orEmpty()
                completed.countDown()
            },
        )

        assertTrue(completed.await(2, TimeUnit.SECONDS))
        assertEquals(listOf("storage failure"), failure)
        queue.dispose { error("no pending work expected") }
    }

    @Test
    fun delayedWorkerCompletionAfterDisposeIsIgnored() {
        val release = CountDownLatch(1)
        val started = CountDownLatch(1)
        val queue = MergeRelayAsyncWorkQueue(
            executor = Executors.newSingleThreadExecutor(),
            dispatch = { work -> work() },
        )
        val successes = mutableListOf<String>()
        val disposed = mutableListOf<Any>()
        queue.register()

        queue.submit(
            token = "write",
            work = {
                started.countDown()
                release.await(2, TimeUnit.SECONDS)
                "saved"
            },
            onSuccess = { successes += it },
            onFailure = { error("work should not fail") },
        )
        assertTrue(started.await(2, TimeUnit.SECONDS))

        queue.dispose { disposed += it }
        release.countDown()

        Thread.sleep(50)
        assertEquals(listOf("write"), disposed)
        assertTrue(successes.isEmpty())
    }

    @Test
    fun rejectedExecutorIsReportedAsFailure() {
        val queue = MergeRelayAsyncWorkQueue(
            executor = RejectingExecutorService(),
            dispatch = { work -> work() },
        )
        val failure = mutableListOf<String>()
        queue.register()

        queue.submit(
            token = "write",
            work = { "unused" },
            onSuccess = { error("work should not run") },
            onFailure = { failure += it.message.orEmpty() },
        )

        assertEquals(listOf("executor rejected"), failure)
        queue.dispose { error("no pending work expected") }
    }
}

private class RejectingExecutorService : AbstractExecutorService() {
    override fun shutdown() = Unit

    override fun shutdownNow(): MutableList<Runnable> = mutableListOf()

    override fun isShutdown(): Boolean = false

    override fun isTerminated(): Boolean = false

    override fun awaitTermination(timeout: Long, unit: TimeUnit): Boolean = true

    override fun execute(command: Runnable) {
        throw IllegalStateException("executor rejected")
    }
}
