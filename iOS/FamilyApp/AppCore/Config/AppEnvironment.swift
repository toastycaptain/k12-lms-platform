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
        let processEnvironment = ProcessInfo.processInfo.environment
        let raw = processEnvironment["K12_IOS_FAMILY_AUTH_BYPASS"]?.lowercased()
            ?? processEnvironment["K12_IOS_AUTH_BYPASS"]?.lowercased()

        if let raw {
            return ["1", "true", "yes", "on"].contains(raw)
        }

        return true
    }

    var testFamilyMember: CurrentUserEnvelope.User {
        let processEnvironment = ProcessInfo.processInfo.environment

        return CurrentUserEnvelope.User(
            id: Int(processEnvironment["K12_IOS_TEST_FAMILY_ID"] ?? "9101") ?? 9101,
            email: processEnvironment["K12_IOS_TEST_FAMILY_EMAIL"] ?? "family.test@k12.local",
            first_name: processEnvironment["K12_IOS_TEST_FAMILY_FIRST_NAME"] ?? "Test",
            last_name: processEnvironment["K12_IOS_TEST_FAMILY_LAST_NAME"] ?? "Family",
            roles: ["guardian"]
        )
    }

    var testTenant: CurrentUserEnvelope.Tenant {
        let processEnvironment = ProcessInfo.processInfo.environment

        return CurrentUserEnvelope.Tenant(
            id: Int(processEnvironment["K12_IOS_TEST_FAMILY_TENANT_ID"]
                ?? processEnvironment["K12_IOS_TEST_TENANT_ID"]
                ?? "1") ?? 1,
            name: processEnvironment["K12_IOS_TEST_FAMILY_TENANT_NAME"]
                ?? processEnvironment["K12_IOS_TEST_TENANT_NAME"]
                ?? "Test School",
            slug: processEnvironment["K12_IOS_TEST_FAMILY_TENANT_SLUG"]
                ?? processEnvironment["K12_IOS_TEST_TENANT_SLUG"]
                ?? "test-school"
        )
    }

    static var current: AppEnvironment {
        let raw = ProcessInfo.processInfo.environment["K12_IOS_ENV"]?.lowercased() ?? "dev"
        return AppEnvironment(rawValue: raw) ?? .dev
    }
}
