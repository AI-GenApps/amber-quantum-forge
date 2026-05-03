import StarterAI
import SwiftUI

struct MessageBubble: View {
    let message: AIMessage

    var isUser: Bool { message.role == .user }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 40) }
            Group {
                if message.content.isEmpty && message.role == .assistant {
                    TypingIndicator()
                } else {
                    Text(message.content)
                        .foregroundStyle(isUser ? Color.white : Color.primary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                }
            }
            .background(isUser ? Color.accentColor : Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            if !isUser { Spacer(minLength: 40) }
        }
    }
}

private struct TypingIndicator: View {
    @State private var phase = 0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { i in
                Circle()
                    .frame(width: 8, height: 8)
                    .opacity(phase == i ? 1.0 : 0.3)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .onAppear {
            Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
                phase = (phase + 1) % 3
            }
        }
    }
}
