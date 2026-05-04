import SwiftUI

private struct OnboardingSlide: Identifiable {
    let id: String
    let emoji: String
    let title: String
    let body: String
}

private let slides: [OnboardingSlide] = [
    OnboardingSlide(id: "welcome", emoji: "👋", title: "Welcome", body: "Your AI-powered starter app."),
    OnboardingSlide(id: "chat", emoji: "💬", title: "Chat", body: "Ask anything, get instant answers."),
    OnboardingSlide(id: "get-started", emoji: "🚀", title: "Get Started", body: "Sign in to unlock all features."),
]

struct OnboardingView: View {
    @State private var viewModel = OnboardingViewModel()
    @State private var page = 0

    var body: some View {
        TabView(selection: $page) {
            ForEach(Array(slides.enumerated()), id: \.element.id) { index, slide in
                VStack(spacing: 24) {
                    Text(slide.emoji).font(.system(size: 64))
                    Text(slide.title).font(.title).bold()
                    Text(slide.body).font(.body).multilineTextAlignment(.center)
                    if index == slides.count - 1 {
                        Button("Get Started") {
                            viewModel.completeOnboarding()
                        }
                        .buttonStyle(.borderedProminent)
                        .hapticImpact(.impact(weight: .heavy))
                    }
                }
                .padding()
                .tag(index)
            }
        }
        .tabViewStyle(.page)
        .indexViewStyle(.page(backgroundDisplayMode: .always))
    }
}
