import Foundation

@MainActor
@Observable
class OnboardingViewModel {
    private let onboardingKey = "onboarding_seen"

    var isComplete: Bool {
        UserDefaults.standard.bool(forKey: onboardingKey)
    }

    func completeOnboarding() {
        UserDefaults.standard.set(true, forKey: onboardingKey)
    }
}
