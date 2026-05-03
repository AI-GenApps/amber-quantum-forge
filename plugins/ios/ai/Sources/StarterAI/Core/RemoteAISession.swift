import Foundation

public final class RemoteAISession: AISession {
    public private(set) var messages: [AIMessage] = []

    private let networkClient: AINetworkClient

    public init(baseURL: URL, getAccessToken: @escaping () async throws -> String) {
        self.networkClient = AINetworkClient(baseURL: baseURL, getAccessToken: getAccessToken)
    }

    public func send(_ text: String) async throws -> AsyncThrowingStream<String, Error> {
        let userMessage = AIMessage(role: .user, content: text)
        messages.append(userMessage)
        let history = messages
        return AsyncThrowingStream { continuation in
            Task {
                let parser = VercelDataStreamParser()
                var assistantContent = ""
                parser.onToken = { token in
                    assistantContent += token
                    continuation.yield(token)
                }
                parser.onFinish = { _ in
                    continuation.finish()
                }
                parser.onError = { error in
                    continuation.finish(throwing: error)
                }
                do {
                    let lineStream = self.networkClient.streamChat(messages: history)
                    for try await line in lineStream {
                        parser.parse(line: line)
                    }
                    if !assistantContent.isEmpty {
                        let assistantMessage = AIMessage(role: .assistant, content: assistantContent)
                        self.messages.append(assistantMessage)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    public func clear() {
        messages = []
    }
}
