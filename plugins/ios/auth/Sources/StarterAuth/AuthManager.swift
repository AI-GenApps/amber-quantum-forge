import Foundation

public actor AuthManager {
    public static let shared = AuthManager()

    private var baseURL: URL?
    private var currentToken: AuthToken?

    private init() {}

    public func configure(baseURL: URL) {
        self.baseURL = baseURL
    }

    public func signIn(with provider: AuthProvider) async throws -> AuthToken {
        let idToken = try await provider.signIn()
        let token = try await exchange(idToken: idToken)
        try KeychainHelper.save(token)
        currentToken = token
        return token
    }

    public func currentAccessToken() async throws -> String {
        guard let token = currentToken else {
            throw AuthError.notSignedIn
        }
        return token.accessToken
    }

    private func exchange(idToken: String) async throws -> AuthToken {
        guard let baseURL else {
            throw AuthError.invalidResponse
        }
        let url = baseURL.appendingPathComponent("/api/auth/exchange")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["idToken": idToken])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw AuthError.invalidResponse
        }
        let decoded = try JSONDecoder().decode(ExchangeResponse.self, from: data)
        let expiresAt = Date(timeIntervalSinceNow: TimeInterval(decoded.expiresIn))
        return AuthToken(
            accessToken: decoded.accessToken,
            refreshToken: decoded.refreshToken,
            expiresAt: expiresAt
        )
    }
}
