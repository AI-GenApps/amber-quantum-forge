package app.w3dev.shared.network

class SharedApiException(
    val statusCode: Int,
    val responseBody: String,
) : Exception("API request failed with HTTP $statusCode")
