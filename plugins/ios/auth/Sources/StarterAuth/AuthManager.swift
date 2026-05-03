import Foundation

public actor AuthManager {
    public static let shared = AuthManager()

    private var baseURL: URL?
    private var currentToken: AuthToken?
    private var refreshTask: Task<AuthToken, Error>?

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

    public func request(_ urlRequest: URLRequest) async throws -> (Data, URLResponse) {
        guard let token = currentToken else {
            throw AuthError.notSignedIn
        }
        var req = urlRequest
        req.setValue("Bearer \(token.accessToken)", forHTTPHeaderField: "Authorization")
        let (data, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse, http.statusCode == 401 {
            let refreshed = try await refreshIfNeeded()
            var retryReq = urlRequest
            retryReq.setValue("Bearer \(refreshed.accessToken)", forHTTPHeaderField: "Authorization")
            return try await URLSession.shared.data(for: retryReq)
        }
        return (data, response)
    }

    public func signOut() async throws {
        if let baseURL, let token = currentToken {
            let url = baseURL.appendingPathComponent("/api/auth/revoke")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.setValue("Bearer \(token.accessToken)", forHTTPHeaderField: "Authorization")
            req.httpBody = try? JSONEncoder().encode(["refreshToken": token.refreshToken])
            _ = try? await URLSession.shared.data(for: req)
        }
        try KeychainHelper.delete()
        currentToken = nil
    }

    private func refreshIfNeeded() async throws -> AuthToken {
        if let existing = refreshTask {
            return try await existing.value
        }
        let task = Task<AuthToken, Error> { [weak self] in
            guard let self else { throw AuthError.notSignedIn }
            return try await self.refresh()
        }
        refreshTask = task
        do {
            let token = try await task.value
            refreshTask = nil
            return token
        } catch {
            refreshTask = nil
            throw error
        }
    }

    private func refresh() async throws -> AuthToken {
        guard let baseURL, let current = currentToken else {
            throw AuthError.tokenExpired
        }
        let url = baseURL.appendingPathComponent("/api/auth/refresh")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(["refreshToken": current.refreshToken])
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw AuthError.tokenExpired
        }
        let decoded = try JSONDecoder().decode(RefreshResponse.self, from: data)
        let expiresAt = Date(timeIntervalSinceNow: TimeInterval(decoded.expiresIn))
        let token = AuthToken(
            accessToken: decoded.accessToken,
            refreshToken: decoded.refreshToken,
            expiresAt: expiresAt
        )
        try KeychainHelper.save(token)
        currentToken = token
        return token
    }

    private func exchange(idToken: String) async throws -> AuthToken {
        guard let baseURL else {
            throw AuthError.invalidResponse
        }
        let url = baseURL.appendingPathComponent("/api/auth/exchange")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(["idToken": idToken])
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
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
