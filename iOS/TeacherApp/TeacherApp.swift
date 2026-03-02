import SwiftUI

@main
struct TeacherApp: App {
    private let environment = AppEnvironment.current

    @StateObject private var bootstrapper: SessionBootstrapper
    @StateObject private var dataStore = TeacherDataStore()

    init() {
        let environment = AppEnvironment.current
        _bootstrapper = StateObject(
            wrappedValue: SessionBootstrapper(
                apiClient: APIClient(environment: environment),
                environment: environment
            )
        )
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if bootstrapper.isLoading {
                    ProgressView("Loading teacher session...")
                } else if let currentUser = bootstrapper.currentUser {
                    DashboardView(
                        environment: environment,
                        currentUser: currentUser,
                        tenant: bootstrapper.tenant
                    )
                    .environmentObject(dataStore)
                } else {
                    PlaceholderFeatureView(
                        title: "Sign-In Required",
                        subtitle: bootstrapper.errorMessage ?? "Authenticate via web and retry."
                    )
                }
            }
            .task {
                await bootstrapper.bootstrapSession()
            }
        }
    }
}
