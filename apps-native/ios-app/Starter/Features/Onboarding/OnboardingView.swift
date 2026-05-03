import SwiftUI

private struct OnboardingSlide {
    let emoji: String
    let title: String
    let body: String
}

private let slides: [OnboardingSlide] = [
    OnboardingSlide(emoji: "👋", title: "Welcome", body: "Your AI-powered starter app."),
    OnboardingSlide(emoji: "💬", title: "Chat", body: "Ask anything, get instant answers."),
    OnboardingSlide(emoji: "🚀", title: "Get Started", body: "Sign in to unlock all features."),
]

struct OnboardingView: View {
    @State private var viewModel = OnboardingViewModel()
    @State private var page = 0

    var body: some View {
        TabView(selection: $page) {
            ForEach(slides.indices, id: \.self) { index in
                VStack(spacing: 24) {
                    Text(slides[index].emoji).font(.system(size: 64))
                    Text(slides[index].title).font(.title).bold()
                    Text(slides[index].body).font(.body).multilineTextAlignment(.center)
                    if index == slides.count - 1 {
                        Button("Get Started") {
                            viewModel.completeOnboarding()
                        }
                        .buttonStyle(.borderedProminent)
                        .hapticImpact(.heavy)
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
