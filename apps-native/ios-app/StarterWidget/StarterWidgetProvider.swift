import WidgetKit

struct StarterWidgetProvider: TimelineProvider {
    private let appGroup = "group.app.w3dev.starter"
    private let lastMessageKey = "lastMessage"

    func placeholder(in context: Context) -> StarterWidgetEntry {
        StarterWidgetEntry(date: .now, lastMessage: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (StarterWidgetEntry) -> Void) {
        completion(entry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<StarterWidgetEntry>) -> Void) {
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: .now) ?? .now
        completion(Timeline(entries: [entry()], policy: .after(refresh)))
    }

    private func entry() -> StarterWidgetEntry {
        let message = UserDefaults(suiteName: appGroup)?.string(forKey: lastMessageKey)
        return StarterWidgetEntry(date: .now, lastMessage: message)
    }
}
