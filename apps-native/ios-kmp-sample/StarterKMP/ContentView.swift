import SwiftUI

struct ContentView: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var model: HealthViewModel

    init(repository: HealthRepositoryClient?, configurationError: String?) {
        _model = State(initialValue: HealthViewModel(repository: repository, configurationError: configurationError))
    }

    var body: some View {
        NavigationStack {
            HealthStatusView(state: model.state, retry: model.load)
                .navigationTitle("Starter KMP")
                .navigationBarTitleDisplayMode(.inline)
        }
        .task {
            model.load()
        }
        .onDisappear {
            model.close()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .background {
                model.cancel()
            } else if phase == .active, case .idle = model.state {
                model.load()
            }
        }
    }
}

private struct HealthStatusView: View {
    let state: HealthState
    let retry: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HeaderView()
                stateView
            }
            .padding(24)
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    @ViewBuilder
    private var stateView: some View {
        switch state {
        case .idle:
            EmptyStateView()
        case .loading:
            LoadingStateView()
        case .loaded(let snapshot):
            SuccessStateView(snapshot: snapshot)
        case .failed(let message):
            ErrorStateView(message: message, retry: retry)
        }
    }
}

private struct HeaderView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Shared health check", systemImage: "arrow.triangle.2.circlepath")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.tint)
            Text("One API, native screens")
                .font(.largeTitle.bold())
            Text("The repository and response model are provided by the Kotlin Multiplatform framework.")
                .font(.body)
                .foregroundStyle(.secondary)
        }
    }
}

private struct EmptyStateView: View {
    var body: some View {
        StateCard(symbol: "bolt.horizontal.circle", title: "Ready to connect", message: "Run the health check to verify the shared API client.")
    }
}

private struct LoadingStateView: View {
    var body: some View {
        StateCard(symbol: "hourglass", title: "Checking API", message: "Waiting for a response from the shared repository.")
            .redacted(reason: .placeholder)
    }
}

private struct SuccessStateView: View {
    let snapshot: HealthSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            StateCard(symbol: "checkmark.circle.fill", title: "API is healthy", message: "The KMP repository returned a successful response.")
            DetailRow(label: "Status", value: snapshot.status)
            DetailRow(label: "Timestamp", value: snapshot.timestamp)
        }
    }
}

private struct ErrorStateView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            StateCard(symbol: "exclamationmark.triangle.fill", title: "Could not reach API", message: message)
            Button("Retry", systemImage: "arrow.clockwise", action: retry)
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
        }
    }
}

private struct StateCard: View {
    let symbol: String
    let title: String
    let message: String

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.headline)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: symbol)
                .font(.title2)
                .foregroundStyle(.tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(.thinMaterial, in: .rect(cornerRadius: 18))
    }
}

private struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer(minLength: 16)
            Text(value)
                .fontWeight(.semibold)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 4)
    }
}

#Preview("Loading") {
    ContentView(repository: PreviewHealthRepositoryClient(), configurationError: nil)
}
