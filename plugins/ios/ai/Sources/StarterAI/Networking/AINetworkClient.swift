import Foundation

final class AINetworkClient {
    private let baseURL: URL
    private let getAccessToken: () async throws -> String

    init(baseURL: URL, getAccessToken: @escaping () async throws -> String) {
        self.baseURL = baseURL
        self.getAccessToken = getAccessToken
    }

    func streamChat(messages: [AIMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let token = try await self.getAccessToken()
                    let url = self.baseURL.appendingPathComponent("/api/ai/chat")
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
                    let encoder = JSONEncoder()
                    encoder.keyEncodingStrategy = .convertToSnakeCase
                    request.httpBody = try encoder.encode(["messages": messages])

                    let (asyncBytes, response) = try await URLSession.shared.bytes(for: request)
                    if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                        throw AIError.serverError(http.statusCode)
                    }
                    for try await line in asyncBytes.lines {
                        if !line.isEmpty {
                            continuation.yield(line)
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}
