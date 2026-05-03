import Foundation
import Security

enum KeychainError: Error {
    case unexpectedStatus(OSStatus)
}

enum KeychainHelper {
    private static let service = "app.w3dev.starter.auth"

    static func save(_ token: AuthToken) throws {
        try set(token.accessToken, forKey: "accessToken")
        try set(token.refreshToken, forKey: "refreshToken")
        try set(ISO8601DateFormatter().string(from: token.expiresAt), forKey: "tokenExpiresAt")
    }

    static func load() throws -> AuthToken? {
        guard
            let accessToken = try get(forKey: "accessToken"),
            let refreshToken = try get(forKey: "refreshToken"),
            let expiresAtString = try get(forKey: "tokenExpiresAt"),
            let expiresAt = ISO8601DateFormatter().date(from: expiresAtString)
        else {
            return nil
        }
        return AuthToken(accessToken: accessToken, refreshToken: refreshToken, expiresAt: expiresAt)
    }

    static func delete() throws {
        try remove(forKey: "accessToken")
        try remove(forKey: "refreshToken")
        try remove(forKey: "tokenExpiresAt")
    }

    private static func set(_ value: String, forKey key: String) throws {
        let data = Data(value.utf8)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key,
        ]
        let attributes: [CFString: Any] = [kSecValueData: data]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var addQuery = query
            addQuery[kSecValueData] = data
            addQuery[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
            guard addStatus == errSecSuccess else { throw KeychainError.unexpectedStatus(addStatus) }
        } else if status != errSecSuccess {
            throw KeychainError.unexpectedStatus(status)
        }
    }

    private static func get(forKey key: String) throws -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else { throw KeychainError.unexpectedStatus(status) }
        guard let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func remove(forKey key: String) throws {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key,
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unexpectedStatus(status)
        }
    }
}
