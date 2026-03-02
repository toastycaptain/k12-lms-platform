// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "TeacherApp",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .executable(name: "TeacherApp", targets: ["TeacherApp"])
    ],
    targets: [
        .executableTarget(
            name: "TeacherApp",
            path: ".",
            exclude: ["README.md", "project.yml"],
            sources: [
                "TeacherApp.swift",
                "AppCore",
                "Features"
            ]
        )
    ]
)
