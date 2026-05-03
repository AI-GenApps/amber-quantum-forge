import Foundation

struct ExchangeResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
}
