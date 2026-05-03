import Foundation

public protocol AuthProvider {
    func signIn() async throws -> String
}
