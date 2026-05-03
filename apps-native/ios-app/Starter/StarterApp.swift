import FirebaseCore
import RevenueCat
import SwiftUI

@main
struct StarterApp: App {
    @State private var viewModel = OnboardingViewModel()

    init() {
        FirebaseApp.configure()
        Purchases.configure(withAPIKey: AppConfig.revenueCatKey)
    }

    var body: some Scene {
        WindowGroup {
            if viewModel.isComplete {
                ContentView()
            } else {
                OnboardingView()
            }
        }
    }
}
