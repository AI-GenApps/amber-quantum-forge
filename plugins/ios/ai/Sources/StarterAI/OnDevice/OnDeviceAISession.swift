import Foundation

public final class OnDeviceAISession: AISession {
    public var messages: [AIMessage] = []

    public init() {}

    public func send(_ text: String) async throws -> AsyncThrowingStream<String, Error> {
        print("[StarterAI] OnDeviceAISession not implemented — falling back is recommended")
        return AsyncThrowingStream { continuation in
            continuation.finish(throwing: AIError.serverError(501))
        }
    }

    public func clear() {
        messages = []
    }
}
