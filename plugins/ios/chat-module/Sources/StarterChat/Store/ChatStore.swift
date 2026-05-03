import Foundation
import SwiftData

public final class ChatStore {
    public init() {}

    @MainActor
    public static func makeContainer() throws -> ModelContainer {
        let schema = Schema([ChatMessage.self, ChatSession.self])
        return try ModelContainer(for: schema)
    }

    @MainActor
    public func sessions(context: ModelContext) throws -> [ChatSession] {
        let descriptor = FetchDescriptor<ChatSession>(sortBy: [SortDescriptor(\.updatedAt, order: .reverse)])
        return try context.fetch(descriptor)
    }

    @MainActor
    public func messages(for sessionId: UUID, context: ModelContext) throws -> [ChatMessage] {
        let descriptor = FetchDescriptor<ChatMessage>(
            predicate: #Predicate { $0.sessionId == sessionId },
            sortBy: [SortDescriptor(\.createdAt)]
        )
        return try context.fetch(descriptor)
    }

    @MainActor
    public func insert(_ message: ChatMessage, context: ModelContext) {
        context.insert(message)
    }
}
