// swift-tools-version: 6.2
// Package manifest for the QCortex macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "QCortex",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "QCortexIPC", targets: ["QCortexIPC"]),
        .library(name: "QCortexDiscovery", targets: ["QCortexDiscovery"]),
        .executable(name: "QCortex", targets: ["QCortex"]),
        .executable(name: "qcortex-mac", targets: ["QCortexMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/QCortexKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "QCortexIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "QCortexDiscovery",
            dependencies: [
                .product(name: "QCortexKit", package: "QCortexKit"),
            ],
            path: "Sources/QCortexDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "QCortex",
            dependencies: [
                "QCortexIPC",
                "QCortexDiscovery",
                .product(name: "QCortexKit", package: "QCortexKit"),
                .product(name: "QCortexChatUI", package: "QCortexKit"),
                .product(name: "QCortexProtocol", package: "QCortexKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/QCortex.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "QCortexMacCLI",
            dependencies: [
                "QCortexDiscovery",
                .product(name: "QCortexKit", package: "QCortexKit"),
                .product(name: "QCortexProtocol", package: "QCortexKit"),
            ],
            path: "Sources/QCortexMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "QCortexIPCTests",
            dependencies: [
                "QCortexIPC",
                "QCortex",
                "QCortexDiscovery",
                .product(name: "QCortexProtocol", package: "QCortexKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
