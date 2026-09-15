package app.w3dev.shared.health

import kotlinx.serialization.Serializable

@Serializable
data class ServiceStatus(
    val status: String,
    val timestamp: String,
)
