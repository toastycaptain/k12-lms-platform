import SwiftUI

@main
struct StudentApp: App {
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
                    ZStack {
                        Color(uiColor: .systemGroupedBackground).ignoresSafeArea()
                        ProgressView("Loading session...")
                            .controlSize(.large)
                    }
                } else if bootstrapper.currentUser != nil {
                    StudentRootView(environment: environment)
                } else {
                    PlaceholderFeatureView(
                        title: "Sign-In Required",
                        symbol: "person.crop.circle.badge.exclamationmark",
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

private struct StudentRootView: View {
    let environment: AppEnvironment

    var body: some View {
        TabView {
            NavigationStack {
                DashboardView(environment: environment)
            }
            .tabItem {
                Label("Home", systemImage: "house")
            }

            NavigationStack {
                MessagingView()
            }
            .tabItem {
                Label("Messages", systemImage: "message")
            }

            NavigationStack {
                PortfolioPlaceholderView(isFeatureEnabled: environment.portfolioLiveEnabled)
            }
            .tabItem {
                Label("Portfolio", systemImage: "folder")
            }
        }
    }
}
