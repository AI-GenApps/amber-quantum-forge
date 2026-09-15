package app.w3dev.shared.network

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess

class SharedApiClient internal constructor(
    baseUrl: String,
    private val httpClient: HttpClient,
) {
    constructor(baseUrl: String) : this(baseUrl, createPlatformHttpClient())

    private val normalizedBaseUrl = baseUrl.trimEnd('/')

    init {
        require(normalizedBaseUrl.isNotEmpty()) { "API base URL must not be empty" }
    }

    suspend fun get(path: String): String {
        val response = httpClient.get("$normalizedBaseUrl/${path.trimStart('/')}")
        val responseBody = response.bodyAsText()
        if (!response.status.isSuccess()) {
            throw SharedApiException(response.status.value, responseBody)
        }
        return responseBody
    }

    fun close() {
        httpClient.close()
    }
}
