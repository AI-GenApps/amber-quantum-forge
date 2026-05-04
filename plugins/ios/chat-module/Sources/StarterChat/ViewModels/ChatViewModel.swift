import Foundation
import StarterAI
import SwiftData

@MainActor
@Observable
public final class ChatViewModel {
    public var messages: [AIMessage] = []
    public var isStreaming: Bool = false
    public var error: AIError?

    private let session: any AISession
    private let store: ChatStore
    private let modelContext: ModelContext
    private let sessionId: UUID

    public init(session: any AISession, store: ChatStore, modelContext: ModelContext, sessionId: UUID = UUID()) {
        self.session = session
        self.store = store
        self.modelContext = modelContext
        self.sessionId = sessionId
    }

    public func send(_ text: String) async {
        let userMessage = AIMessage(role: .user, content: text)
        messages.append(userMessage)
        store.insert(ChatMessage(from: userMessage, sessionId: sessionId), context: modelContext)

        let placeholder = AIMessage(role: .assistant, content: "")
        messages.append(placeholder)
        isStreaming = true
        error = nil

        do {
            let stream = try await session.send(text)
            var assistantContent = ""
            for try await token in stream {
                assistantContent += token
                if let idx = messages.indices.last {
                    messages[idx] = AIMessage(
                        id: placeholder.id,
                        role: .assistant,
                        content: assistantContent,
                        createdAt: placeholder.createdAt
                    )
                }
            }
            isStreaming = false
            if let idx = messages.indices.last {
                let completed = messages[idx]
                store.insert(ChatMessage(from: completed, sessionId: sessionId), context: modelContext)
            }
        } catch let err as AIError {
            messages.removeLast()
            error = err
            isStreaming = false
        } catch {
            messages.removeLast()
            self.error = AIError.networkError(error)
            isStreaming = false
        }
    }
}
