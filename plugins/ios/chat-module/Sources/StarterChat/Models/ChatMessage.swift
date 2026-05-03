import Foundation
import StarterAI
import SwiftData

@Model
public final class ChatMessage {
    public var id: UUID
    public var sessionId: UUID
    public var role: String
    public var content: String
    public var createdAt: Date
    public var syncedAt: Date?

    public init(id: UUID = UUID(), sessionId: UUID, role: String, content: String, createdAt: Date = Date(), syncedAt: Date? = nil) {
        self.id = id
        self.sessionId = sessionId
        self.role = role
        self.content = content
        self.createdAt = createdAt
        self.syncedAt = syncedAt
    }

    public convenience init(from message: AIMessage, sessionId: UUID) {
        self.init(
            id: message.id,
            sessionId: sessionId,
            role: message.role.rawValue,
            content: message.content,
            createdAt: message.createdAt
        )
    }
}
