import SwiftUI

struct HapticModifier: ViewModifier {
    let style: UIImpactFeedbackGenerator.FeedbackStyle

    func body(content: Content) -> some View {
        content.onTapGesture {
            UIImpactFeedbackGenerator(style: style).impactOccurred()
        }
    }
}

extension View {
    func hapticImpact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) -> some View {
        modifier(HapticModifier(style: style))
    }
}
