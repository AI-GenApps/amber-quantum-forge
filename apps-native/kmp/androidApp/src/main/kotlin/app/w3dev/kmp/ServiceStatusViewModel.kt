package app.w3dev.kmp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.w3dev.shared.health.ServiceStatus
import app.w3dev.shared.health.ServiceStatusRepository
import app.w3dev.shared.network.SharedApiClient
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ServiceStatusUiState(
    val isLoading: Boolean = false,
    val serviceStatus: ServiceStatus? = null,
    val errorMessage: String? = null,
)

class ServiceStatusViewModel(
    baseUrl: String,
) : ViewModel() {
    private val repository = if (baseUrl.isBlank()) {
        null
    } else {
        ServiceStatusRepository(SharedApiClient(baseUrl))
    }
    private val mutableState = MutableStateFlow(ServiceStatusUiState())
    private var refreshJob: Job? = null

    val state: StateFlow<ServiceStatusUiState> = mutableState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        refreshJob?.cancel()
        val currentRepository = repository
        if (currentRepository == null) {
            mutableState.value = ServiceStatusUiState(errorMessage = "API base URL is not configured")
            return
        }

        mutableState.value = ServiceStatusUiState(isLoading = true)
        refreshJob = viewModelScope.launch {
            try {
                mutableState.value = ServiceStatusUiState(serviceStatus = currentRepository.fetch())
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                mutableState.value = ServiceStatusUiState(
                    errorMessage = error.message ?: "Unable to load service status",
                )
            }
        }
    }

    override fun onCleared() {
        refreshJob?.cancel()
        repository?.close()
        super.onCleared()
    }
}
