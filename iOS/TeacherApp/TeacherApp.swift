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
                    ZStack {
                        Color(uiColor: .systemGroupedBackground).ignoresSafeArea()
                        ProgressView("Loading teacher session...")
                            .controlSize(.large)
                    }
                } else if let currentUser = bootstrapper.currentUser {
                    TeacherRootView(
                        environment: environment,
                        currentUser: currentUser,
                        tenant: bootstrapper.tenant
                    )
                    .environmentObject(dataStore)
                } else {
                    PlaceholderFeatureView(
                        title: "Sign-In Required",
                        symbol: "person.crop.circle.badge.exclamationmark",
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

private struct TeacherRootView: View {
    let environment: AppEnvironment
    let currentUser: CurrentUserEnvelope.User
    let tenant: CurrentUserEnvelope.Tenant?

    var body: some View {
        TabView {
            NavigationStack {
                DashboardView(
                    environment: environment,
                    currentUser: currentUser,
                    tenant: tenant
                )
            }
            .tabItem {
                Label("Home", systemImage: "house")
            }

            NavigationStack {
                TodoListView()
            }
            .tabItem {
                Label("Tasks", systemImage: "checklist")
            }

            NavigationStack {
                MessagingView()
            }
            .tabItem {
                Label("Messages", systemImage: "message")
            }

            NavigationStack {
                AnnouncementsView()
            }
            .tabItem {
                Label("Updates", systemImage: "megaphone")
            }
        }
    }
}
