import Foundation

struct CurrentUserEnvelope: Decodable {
    struct User: Decodable {
        let id: Int
        let email: String
        let first_name: String
        let last_name: String
        let roles: [String]
    }

    struct Tenant: Decodable {
        let id: Int
        let name: String
        let slug: String
    }

    let user: User
    let tenant: Tenant
}

@MainActor
final class SessionBootstrapper: ObservableObject {
    @Published var currentUser: CurrentUserEnvelope.User?
    @Published var tenant: CurrentUserEnvelope.Tenant?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient: APIClient
    private let environment: AppEnvironment

    init(apiClient: APIClient, environment: AppEnvironment) {
        self.apiClient = apiClient
        self.environment = environment
    }

    func bootstrapSession() async {
        isLoading = true
        errorMessage = nil

        if environment.authBypassEnabled {
            currentUser = environment.testFamilyMember
            tenant = environment.testTenant
            isLoading = false
            return
        }

        do {
            let payload = try await apiClient.get("/api/v1/me", as: CurrentUserEnvelope.self)
            currentUser = payload.user
            tenant = payload.tenant
        } catch {
            currentUser = nil
            tenant = nil
            errorMessage = "Sign-in required. Please authenticate via the family web session flow."
        }

        isLoading = false
    }
}
