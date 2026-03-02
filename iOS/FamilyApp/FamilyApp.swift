import SwiftUI

@main
struct FamilyApp: App {
    private let environment = AppEnvironment.current
    @StateObject private var bootstrapper: SessionBootstrapper

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
                    ProgressView("Loading family session...")
                } else if bootstrapper.currentUser != nil {
                    DashboardView(environment: environment)
                } else {
                    PlaceholderFeatureView(
                        title: "Sign-In Required",
                        subtitle: bootstrapper.errorMessage ?? "Authenticate via Google and retry."
                    )
                }
            }
            .task {
                await bootstrapper.bootstrapSession()
            }
        }
    }
}
