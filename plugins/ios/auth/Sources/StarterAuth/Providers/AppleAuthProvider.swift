import AuthenticationServices
import FirebaseAuth
import Foundation
import UIKit

public final class AppleAuthProvider: NSObject, AuthProvider,
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    private var continuation: CheckedContinuation<String, Error>?
    private var currentNonce: String?

    public override init() {}

    @MainActor
    public func signIn() async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            let nonce = randomNonceString()
            self.currentNonce = nonce
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = sha256(nonce)
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard
            let appleCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
            let tokenData = appleCredential.identityToken,
            let tokenString = String(data: tokenData, encoding: .utf8),
            let nonce = currentNonce
        else {
            continuation?.resume(throwing: AuthError.invalidResponse)
            continuation = nil
            return
        }
        let credential = OAuthProvider.appleCredential(
            withIDToken: tokenString,
            rawNonce: nonce,
            fullName: appleCredential.fullName
        )
        Task {
            do {
                let result = try await Auth.auth().signIn(with: credential)
                let idToken = try await result.user.getIDToken()
                continuation?.resume(returning: idToken)
            } catch {
                continuation?.resume(throwing: AuthError.firebaseError(error))
            }
            continuation = nil
        }
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        continuation?.resume(throwing: AuthError.firebaseError(error))
        continuation = nil
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        return scene?.windows.first { $0.isKeyWindow } ?? UIWindow()
    }
}
