import Foundation

public enum AIError: Error {
    case networkError(Error)
    case streamParseError
    case unauthorized
    case serverError(Int)
}
