// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "StarterAuth",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "StarterAuth", targets: ["StarterAuth"]),
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0"),
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "7.1.0"),
    ],
    targets: [
        .target(
            name: "StarterAuth",
            dependencies: [
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS"),
            ],
            path: "Sources/StarterAuth"
        ),
    ]
)
