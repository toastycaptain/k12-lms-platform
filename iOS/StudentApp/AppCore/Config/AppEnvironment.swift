import Foundation

enum AppEnvironment: String {
    case dev
    case staging
    case prod

    var apiBaseURL: URL {
        switch self {
        case .dev:
            return URL(string: "http://localhost:3001")!
        case .staging:
            return URL(string: "https://k12-web-staging.up.railway.app")!
        case .prod:
            return URL(string: "https://k12-web-production.up.railway.app")!
        }
    }

    var portfolioLiveEnabled: Bool {
        false
    }

    static var current: AppEnvironment {
        let raw = ProcessInfo.processInfo.environment["K12_IOS_ENV"]?.lowercased() ?? "dev"
        return AppEnvironment(rawValue: raw) ?? .dev
    }
}
