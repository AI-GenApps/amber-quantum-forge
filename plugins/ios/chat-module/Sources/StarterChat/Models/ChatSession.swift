import Foundation
import SwiftData

@Model
public final class ChatSession {
    public var id: UUID
    public var title: String
    public var createdAt: Date
    public var updatedAt: Date

    @Relationship(deleteRule: .cascade, inverse: \ChatMessage.sessionId)
    public var messages: [ChatMessage] = []

    public init(id: UUID = UUID(), title: String, createdAt: Date = Date(), updatedAt: Date = Date()) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
