import Foundation
import StarterAuth
import SwiftData

public actor SyncClient {
    private let baseURL: URL
    private let authManager: AuthManager
    private let modelContext: ModelContext

    public init(baseURL: URL, authManager: AuthManager, modelContext: ModelContext) {
        self.baseURL = baseURL
        self.authManager = authManager
        self.modelContext = modelContext
    }

    public func syncPending() async throws {
        let descriptor = FetchDescriptor<ChatMessage>(
            predicate: #Predicate { $0.syncedAt == nil },
            sortBy: [SortDescriptor(\.createdAt)]
        )
        let pending = try modelContext.fetch(descriptor)
        guard !pending.isEmpty else { return }

        let requestMessages = pending.map {
            SyncRequestMessage(
                id: $0.id.uuidString,
                sessionId: $0.sessionId.uuidString,
                role: $0.role,
                content: $0.content,
                createdAt: $0.createdAt
            )
        }

        let url = baseURL.appendingPathComponent("/api/chat/sync")
        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        urlRequest.httpBody = try encoder.encode(["messages": requestMessages])

        let (data, _) = try await authManager.request(urlRequest)
        _ = try JSONDecoder().decode(SyncResponse.self, from: data)

        let now = Date()
        for message in pending {
            message.syncedAt = now
        }
        try modelContext.save()
    }
}
