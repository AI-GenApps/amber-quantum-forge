import FirebaseCore
import RevenueCat
import SwiftUI

@main
struct StarterApp: App {
    init() {
        FirebaseApp.configure()
        Purchases.configure(withAPIKey: AppConfig.revenueCatKey)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
