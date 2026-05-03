import Foundation

enum AppConfig {
    static let revenueCatKey: String = {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String,
              !value.isEmpty else {
            return ""
        }
        return value
    }()
}
