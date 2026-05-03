import Foundation

public protocol AISession: AnyObject {
    var messages: [AIMessage] { get }
    func send(_ text: String) async throws -> AsyncThrowingStream<String, Error>
    func clear()
}
