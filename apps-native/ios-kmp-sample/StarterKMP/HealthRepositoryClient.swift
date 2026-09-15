import Foundation
import StarterShared

struct HealthSnapshot: Equatable, Sendable {
    let status: String
    let timestamp: String
}

struct HealthClientError: LocalizedError, Equatable, Sendable {
    let message: String

    var errorDescription: String? {
        message
    }
}

@MainActor
protocol HealthRepositoryClient: AnyObject {
    func fetchHealth(completion: @escaping @Sendable (Result<HealthSnapshot, HealthClientError>) -> Void)
    func cancel()
    func close()
}

@MainActor
final class KMPHealthRepositoryClient: HealthRepositoryClient {
    private let baseURL: String
    private var bridge: ServiceStatusBridge?
    private var cancellationHandle: SharedCancellationHandle?

    init(baseURL: URL) {
        self.baseURL = baseURL.absoluteString
    }

    func fetchHealth(completion: @escaping @Sendable (Result<HealthSnapshot, HealthClientError>) -> Void) {
        cancellationHandle?.cancel()
        let bridge = bridge ?? ServiceStatusBridge(baseUrl: baseURL)
        self.bridge = bridge
        cancellationHandle = bridge.fetch(
            onSuccess: { status in
                let snapshot = HealthSnapshot(status: status.status, timestamp: status.timestamp)
                completion(.success(snapshot))
            },
            onFailure: { message in
                completion(.failure(HealthClientError(message: message)))
            }
        )
    }

    func cancel() {
        cancellationHandle?.cancel()
        cancellationHandle = nil
    }

    func close() {
        cancel()
        bridge?.close()
        bridge = nil
    }
}

@MainActor
final class PreviewHealthRepositoryClient: HealthRepositoryClient {
    private var workItem: Task<Void, Never>?

    func fetchHealth(completion: @escaping @Sendable (Result<HealthSnapshot, HealthClientError>) -> Void) {
        workItem?.cancel()
        workItem = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(250))
            guard !Task.isCancelled else { return }
            completion(.success(HealthSnapshot(status: "ok", timestamp: "2026-01-01T00:00:00Z")))
        }
    }

    func cancel() {
        workItem?.cancel()
        workItem = nil
    }

    func close() {
        cancel()
    }
}
