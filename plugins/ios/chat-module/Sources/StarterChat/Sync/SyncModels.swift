import Foundation

struct SyncRequestMessage: Encodable {
    let id: String
    let sessionId: String
    let role: String
    let content: String
    let createdAt: Date
}

struct SyncResponse: Decodable {
    let synced: Int
    let skipped: Int
}
