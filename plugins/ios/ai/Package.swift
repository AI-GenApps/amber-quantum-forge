// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "StarterAI",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "StarterAI", targets: ["StarterAI"]),
    ],
    targets: [
        .target(
            name: "StarterAI",
            path: "Sources/StarterAI"
        ),
    ]
)
