// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "QCortexKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "QCortexProtocol", targets: ["QCortexProtocol"]),
        .library(name: "QCortexKit", targets: ["QCortexKit"]),
        .library(name: "QCortexChatUI", targets: ["QCortexChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "QCortexProtocol",
            path: "Sources/QCortexProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "QCortexKit",
            dependencies: [
                "QCortexProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/QCortexKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "QCortexChatUI",
            dependencies: [
                "QCortexKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/QCortexChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "QCortexKitTests",
            dependencies: ["QCortexKit", "QCortexChatUI"],
            path: "Tests/QCortexKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
