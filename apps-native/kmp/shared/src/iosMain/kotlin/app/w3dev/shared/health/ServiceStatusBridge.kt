package app.w3dev.shared.health

import app.w3dev.shared.network.SharedApiClient
import app.w3dev.shared.network.SharedApiException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class SharedCancellationHandle internal constructor(
    private val job: Job,
) {
    fun cancel() {
        job.cancel()
    }
}

class ServiceStatusBridge(
    baseUrl: String,
) {
    private val repository = baseUrl.trim().takeIf { it.isNotEmpty() }?.let {
        ServiceStatusRepository(SharedApiClient(it))
    }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    fun fetch(
        onSuccess: (ServiceStatus) -> Unit,
        onFailure: (String) -> Unit,
    ): SharedCancellationHandle {
        val currentRepository = repository
        val job = scope.launch {
            try {
                if (currentRepository == null) {
                    onFailure("API base URL is not configured")
                } else {
                    onSuccess(currentRepository.fetch())
                }
            } catch (error: CancellationException) {
                throw error
            } catch (error: SharedApiException) {
                onFailure("HTTP ${error.statusCode}")
            } catch (error: Throwable) {
                onFailure(error.message ?: "Unable to load service status")
            }
        }
        return SharedCancellationHandle(job)
    }

    fun close() {
        scope.cancel()
        repository?.close()
    }
}
