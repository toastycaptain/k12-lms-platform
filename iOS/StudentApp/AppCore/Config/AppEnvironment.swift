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

    var authBypassEnabled: Bool {
        let raw = ProcessInfo.processInfo.environment["K12_IOS_AUTH_BYPASS"]?.lowercased()
        if let raw {
            return ["1", "true", "yes", "on"].contains(raw)
        }
        return true
    }

    var testStudent: CurrentUserEnvelope.User {
        CurrentUserEnvelope.User(
            id: Int(ProcessInfo.processInfo.environment["K12_IOS_TEST_STUDENT_ID"] ?? "9001") ?? 9001,
            email: ProcessInfo.processInfo.environment["K12_IOS_TEST_STUDENT_EMAIL"] ?? "student.test@k12.local",
            first_name: ProcessInfo.processInfo.environment["K12_IOS_TEST_STUDENT_FIRST_NAME"] ?? "Test",
            last_name: ProcessInfo.processInfo.environment["K12_IOS_TEST_STUDENT_LAST_NAME"] ?? "Student",
            roles: ["student"]
        )
    }

    var testTenant: CurrentUserEnvelope.Tenant {
        CurrentUserEnvelope.Tenant(
            id: Int(ProcessInfo.processInfo.environment["K12_IOS_TEST_TENANT_ID"] ?? "1") ?? 1,
            name: ProcessInfo.processInfo.environment["K12_IOS_TEST_TENANT_NAME"] ?? "Test School",
            slug: ProcessInfo.processInfo.environment["K12_IOS_TEST_TENANT_SLUG"] ?? "test-school"
        )
    }

    static var current: AppEnvironment {
        let raw = ProcessInfo.processInfo.environment["K12_IOS_ENV"]?.lowercased() ?? "dev"
        return AppEnvironment(rawValue: raw) ?? .dev
    }
}
