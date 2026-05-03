import Foundation

public enum AuthError: Error {
    case firebaseError(Error)
    case networkError(Error)
    case invalidResponse
    case tokenExpired
    case notSignedIn
}
