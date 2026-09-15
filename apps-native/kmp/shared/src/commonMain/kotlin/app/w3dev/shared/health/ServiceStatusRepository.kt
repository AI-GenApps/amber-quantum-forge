package app.w3dev.shared.health

import app.w3dev.shared.network.SharedApiClient
import kotlinx.serialization.json.Json

class ServiceStatusRepository(
    private val apiClient: SharedApiClient,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun fetch(): ServiceStatus {
        return json.decodeFromString(apiClient.get("health"))
    }

    fun close() {
        apiClient.close()
    }
}
