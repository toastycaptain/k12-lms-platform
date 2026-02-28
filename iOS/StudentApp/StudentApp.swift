import SwiftUI

@main
struct StudentApp: App {
    @StateObject private var bootstrapper = SessionBootstrapper(apiClient: APIClient(environment: .current))

    var body: some Scene {
        WindowGroup {
            Group {
                if bootstrapper.isLoading {
                    ProgressView("Loading session...")
                } else if bootstrapper.currentUser != nil {
                    DashboardView(environment: .current)
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
