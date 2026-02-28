// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "StudentApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .executable(name: "StudentApp", targets: ["StudentApp"])
    ],
    targets: [
        .executableTarget(
            name: "StudentApp",
            path: ".",
            exclude: ["README.md"],
            sources: [
                "StudentApp.swift",
                "AppCore",
                "Features"
            ]
        )
    ]
)
