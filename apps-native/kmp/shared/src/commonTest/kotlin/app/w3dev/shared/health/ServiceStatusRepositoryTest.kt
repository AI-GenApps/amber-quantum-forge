package app.w3dev.shared.health

import app.w3dev.shared.network.SharedApiClient
import app.w3dev.shared.network.SharedApiException
import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.engine.mock.respondError
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.yield
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ServiceStatusRepositoryTest {
    @Test
    fun fetchesHealthStatusAndPreservesApiPath() = runTest {
        var requestedPath = ""
        val client = HttpClient(MockEngine) {
            engine {
                addHandler { request ->
                    requestedPath = request.url.encodedPath
                    respond(
                        content = "{\"status\":\"ok\",\"timestamp\":\"2026-09-15T00:00:00Z\"}",
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }
            }
        }
        val repository = ServiceStatusRepository(SharedApiClient("https://example.test/api", client))

        assertEquals(
            ServiceStatus("ok", "2026-09-15T00:00:00Z"),
            repository.fetch(),
        )
        assertEquals("/api/health", requestedPath)
        repository.close()
    }

    @Test
    fun rejectsMalformedJson() = runTest {
        val client = HttpClient(MockEngine) {
            engine {
                addHandler {
                    respond("{\"status\":", HttpStatusCode.OK)
                }
            }
        }
        val repository = ServiceStatusRepository(SharedApiClient("https://example.test/api", client))

        assertFailsWith<Exception> { repository.fetch() }
        repository.close()
    }

    @Test
    fun reportsHttpErrorsWithStatusAndBody() = runTest {
        val client = HttpClient(MockEngine) {
            engine {
                addHandler {
                    respondError(HttpStatusCode.ServiceUnavailable, "maintenance")
                }
            }
        }
        val repository = ServiceStatusRepository(SharedApiClient("https://example.test/api", client))

        val error = assertFailsWith<SharedApiException> { repository.fetch() }
        assertEquals(503, error.statusCode)
        assertEquals("maintenance", error.responseBody)
        repository.close()
    }

    @Test
    fun requestCancellationStopsInFlightCall() = runTest {
        val requestStarted = CompletableDeferred<Unit>()
        val client = HttpClient(MockEngine) {
            engine {
                addHandler {
                    requestStarted.complete(Unit)
                    kotlinx.coroutines.awaitCancellation()
                }
            }
        }
        val repository = ServiceStatusRepository(SharedApiClient("https://example.test/api", client))
        val request = async { repository.fetch() }

        requestStarted.await()
        yield()
        request.cancelAndJoin()
        assertTrue(request.isCancelled)
        repository.close()
    }
}
