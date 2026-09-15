import SwiftUI

@main
struct StarterKMPApp: App {
    private let repository: HealthRepositoryClient?
    private let configurationError: String?

    init() {
        do {
            let baseURL = try AppConfig.apiBaseURL()
            repository = KMPHealthRepositoryClient(baseURL: baseURL)
            configurationError = nil
        } catch {
            repository = nil
            configurationError = error.localizedDescription
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView(repository: repository, configurationError: configurationError)
        }
    }
}
