import SwiftUI

private struct HapticModifier: ViewModifier {
    let feedback: SensoryFeedback
    @State private var trigger = false

    func body(content: Content) -> some View {
        content
            .onTapGesture { trigger.toggle() }
            .sensoryFeedback(feedback, trigger: trigger)
    }
}

extension View {
    func hapticImpact(_ feedback: SensoryFeedback = .impact(weight: .medium)) -> some View {
        modifier(HapticModifier(feedback: feedback))
    }
}
