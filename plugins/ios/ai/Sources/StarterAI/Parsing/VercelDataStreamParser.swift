import Foundation

final class VercelDataStreamParser {
    struct FinishMetadata: Decodable {
        let finishReason: String
        let usage: UsageMetadata?
    }

    struct UsageMetadata: Decodable {
        let promptTokens: Int
        let completionTokens: Int
    }

    var onToken: ((String) -> Void)?
    var onFinish: ((FinishMetadata) -> Void)?
    var onError: ((Error) -> Void)?

    func parse(line: String) {
        if line.hasPrefix("0:") {
            let raw = String(line.dropFirst(2))
            guard
                let data = raw.data(using: .utf8),
                let token = try? JSONDecoder().decode(String.self, from: data)
            else {
                onError?(AIError.streamParseError)
                return
            }
            onToken?(token)
        } else if line.hasPrefix("d:") {
            let raw = String(line.dropFirst(2))
            guard let data = raw.data(using: .utf8) else {
                onError?(AIError.streamParseError)
                return
            }
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            guard let meta = try? decoder.decode(FinishMetadata.self, from: data) else {
                onError?(AIError.streamParseError)
                return
            }
            onFinish?(meta)
        }
    }
}
