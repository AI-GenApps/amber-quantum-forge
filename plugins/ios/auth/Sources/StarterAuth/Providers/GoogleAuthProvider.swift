import FirebaseAuth
import FirebaseCore
import Foundation
import GoogleSignIn
import UIKit

public final class GoogleAuthProvider: AuthProvider {
    public init() {}

    public func signIn() async throws -> String {
        guard let clientID = FirebaseApp.app()?.options.clientID else {
            throw AuthError.invalidResponse
        }
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config

        guard
            let scene = await UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive }),
            let rootViewController = await scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        else {
            throw AuthError.invalidResponse
        }

        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
        guard let idToken = result.user.idToken?.tokenString else {
            throw AuthError.invalidResponse
        }
        let credential = FirebaseAuth.GoogleAuthProvider.credential(
            withIDToken: idToken,
            accessToken: result.user.accessToken.tokenString
        )
        let authResult = try await Auth.auth().signIn(with: credential)
        return try await authResult.user.getIDToken()
    }
}
