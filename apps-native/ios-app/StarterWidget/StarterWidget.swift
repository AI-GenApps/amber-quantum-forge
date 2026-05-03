import SwiftUI
import WidgetKit

@main
struct StarterWidget: Widget {
    let kind = "StarterWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: StarterWidgetProvider()) { entry in
            StarterWidgetView(entry: entry)
        }
        .configurationDisplayName("Starter")
        .description("Shows your latest chat message.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
