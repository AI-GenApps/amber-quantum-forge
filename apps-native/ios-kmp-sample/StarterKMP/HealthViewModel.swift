import Observation

enum HealthState: Equatable {
    case idle
    case loading
    case loaded(HealthSnapshot)
    case failed(String)
}

@MainActor
@Observable
final class HealthViewModel {
    private let repository: HealthRepositoryClient?
    private var requestGeneration = 0
    private(set) var state: HealthState

    init(repository: HealthRepositoryClient?, configurationError: String?) {
        self.repository = repository
        state = configurationError.map(HealthState.failed) ?? .idle
    }

    func load() {
        guard let repository else { return }
        requestGeneration += 1
        let generation = requestGeneration
        repository.cancel()
        state = .loading
        repository.fetchHealth { [weak self] result in
            Task { @MainActor [weak self] in
                guard let self, self.requestGeneration == generation else { return }
                switch result {
                case .success(let snapshot):
                    state = .loaded(snapshot)
                case .failure(let error):
                    state = .failed(error.localizedDescription)
                }
            }
        }
    }

    func cancel() {
        let wasLoading = state == .loading
        requestGeneration += 1
        repository?.cancel()
        if wasLoading {
            state = .idle
        }
    }

    func close() {
        cancel()
        repository?.close()
    }
}
