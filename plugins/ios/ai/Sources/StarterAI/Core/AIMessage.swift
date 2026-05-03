import Foundation

public enum AIRole: String, Codable {
    case user
    case assistant
}

public struct AIMessage: Codable, Identifiable {
    public let id: UUID
    public let role: AIRole
    public let content: String
    public let createdAt: Date

    public init(id: UUID = UUID(), role: AIRole, content: String, createdAt: Date = Date()) {
        self.id = id
        self.role = role
        self.content = content
        self.createdAt = createdAt
    }
}
