import SwiftUI

struct ChatInput: View {
    let onSend: (String) async -> Void

    @State private var text = ""
    @State private var isSending = false

    var body: some View {
        HStack(spacing: 8) {
            TextField("Message", text: $text, axis: .vertical)
                .lineLimit(1...5)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 20))
            Button {
                guard !text.isEmpty, !isSending else { return }
                let message = text
                text = ""
                isSending = true
                Task {
                    await onSend(message)
                    isSending = false
                }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(text.isEmpty || isSending ? Color.secondary : Color.accentColor)
            }
            .disabled(text.isEmpty || isSending)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}
