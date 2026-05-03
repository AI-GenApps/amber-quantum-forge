// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "StarterChat",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "StarterChat", targets: ["StarterChat"]),
    ],
    dependencies: [
        .package(path: "../auth"),
        .package(path: "../ai"),
    ],
    targets: [
        .target(
            name: "StarterChat",
            dependencies: [
                .product(name: "StarterAuth", package: "auth"),
                .product(name: "StarterAI", package: "ai"),
            ],
            path: "Sources/StarterChat"
        ),
    ]
)
