// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "FamilyApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .executable(name: "FamilyApp", targets: ["FamilyApp"])
    ],
    targets: [
        .executableTarget(
            name: "FamilyApp",
            path: ".",
            exclude: ["README.md"],
            sources: [
                "FamilyApp.swift",
                "AppCore",
                "Features"
            ]
        )
    ]
)
