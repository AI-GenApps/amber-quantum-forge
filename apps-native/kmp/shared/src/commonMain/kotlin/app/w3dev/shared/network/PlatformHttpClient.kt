package app.w3dev.shared.network

import io.ktor.client.HttpClient

expect fun createPlatformHttpClient(): HttpClient
