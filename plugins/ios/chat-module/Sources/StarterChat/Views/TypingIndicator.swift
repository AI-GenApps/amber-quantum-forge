import SwiftUI

struct TypingIndicator: View {
    @State private var phase = 0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .frame(width: 8, height: 8)
                    .opacity(phase == i ? 1.0 : 0.3)
                    .animation(.easeInOut(duration: 0.4).repeatForever(autoreverses: false).delay(Double(i) * 0.4), value: phase)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .onAppear {
            phase = (phase + 1) % 3
        }
    }
}
