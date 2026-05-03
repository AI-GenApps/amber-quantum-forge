import SwiftUI

struct StarterWidgetView: View {
    let entry: StarterWidgetEntry

    var body: some View {
        Link(destination: URL(string: "starter://chat")!) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Starter")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(entry.lastMessage ?? "Tap to start a chat")
                    .font(.body)
                    .lineLimit(3)
            }
            .padding()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }
}
