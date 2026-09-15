import Foundation

enum AppConfigError: LocalizedError {
    case missingBaseURL
    case invalidBaseURL
    case missingAPIPath
    case insecureReleaseURL

    var errorDescription: String? {
        switch self {
        case .missingBaseURL:
            "API_BASE_URL is not configured."
        case .invalidBaseURL:
            "API_BASE_URL must be an absolute URL."
        case .missingAPIPath:
            "API_BASE_URL must include the /api path."
        case .insecureReleaseURL:
            "Release API_BASE_URL must use HTTPS."
        }
    }
}

enum AppConfig {
    static func apiBaseURL(bundle: Bundle = .main) throws -> URL {
        guard let value = bundle.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
              !value.isEmpty else {
            throw AppConfigError.missingBaseURL
        }

        guard let url = URL(string: value), url.scheme != nil, url.host != nil else {
            throw AppConfigError.invalidBaseURL
        }

        let path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard path == "api" || path.hasSuffix("/api") else {
            throw AppConfigError.missingAPIPath
        }

#if !DEBUG
        guard url.scheme?.lowercased() == "https" else {
            throw AppConfigError.insecureReleaseURL
        }
#endif

        return url
    }
}
