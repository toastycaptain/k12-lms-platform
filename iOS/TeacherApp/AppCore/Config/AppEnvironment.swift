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

    var authBypassEnabled: Bool {
        let processEnvironment = ProcessInfo.processInfo.environment
        let raw = processEnvironment["K12_IOS_TEACHER_AUTH_BYPASS"]?.lowercased()
            ?? processEnvironment["K12_IOS_AUTH_BYPASS"]?.lowercased()

        if let raw {
            return ["1", "true", "yes", "on"].contains(raw)
        }

        return true
    }

    var testTeacher: CurrentUserEnvelope.User {
        let processEnvironment = ProcessInfo.processInfo.environment

        return CurrentUserEnvelope.User(
            id: Int(processEnvironment["K12_IOS_TEST_TEACHER_ID"] ?? "9201") ?? 9201,
            email: processEnvironment["K12_IOS_TEST_TEACHER_EMAIL"] ?? "teacher.test@k12.local",
            first_name: processEnvironment["K12_IOS_TEST_TEACHER_FIRST_NAME"] ?? "Test",
            last_name: processEnvironment["K12_IOS_TEST_TEACHER_LAST_NAME"] ?? "Teacher",
            roles: ["teacher"]
        )
    }

    var testTenant: CurrentUserEnvelope.Tenant {
        let processEnvironment = ProcessInfo.processInfo.environment

        return CurrentUserEnvelope.Tenant(
            id: Int(processEnvironment["K12_IOS_TEST_TEACHER_TENANT_ID"]
                ?? processEnvironment["K12_IOS_TEST_TENANT_ID"]
                ?? "1") ?? 1,
            name: processEnvironment["K12_IOS_TEST_TEACHER_TENANT_NAME"]
                ?? processEnvironment["K12_IOS_TEST_TENANT_NAME"]
                ?? "Test School",
            slug: processEnvironment["K12_IOS_TEST_TEACHER_TENANT_SLUG"]
                ?? processEnvironment["K12_IOS_TEST_TENANT_SLUG"]
                ?? "test-school"
        )
    }

    static var current: AppEnvironment {
        let raw = ProcessInfo.processInfo.environment["K12_IOS_ENV"]?.lowercased() ?? "dev"
        return AppEnvironment(rawValue: raw) ?? .dev
    }
}
