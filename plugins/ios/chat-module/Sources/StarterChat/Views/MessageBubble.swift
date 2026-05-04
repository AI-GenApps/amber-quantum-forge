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
