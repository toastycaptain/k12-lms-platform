import SwiftUI

struct DashboardTile: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let destination: AnyView
}

struct DashboardView: View {
    private let analytics = AnalyticsClient()
    private let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment
    }

    private var tiles: [DashboardTile] {
        [
            DashboardTile(
                id: "todo",
                title: "To-do",
                subtitle: "Assignments and tasks",
                destination: AnyView(PlaceholderFeatureView(title: "To-do", subtitle: "Connected to /api/v1/students/:id/todos"))
            ),
            DashboardTile(
                id: "goals",
                title: "Goals",
                subtitle: "Track your goals",
                destination: AnyView(PlaceholderFeatureView(title: "Goals", subtitle: "Connected to /api/v1/goals"))
            ),
            DashboardTile(
                id: "calendar",
                title: "Calendar",
                subtitle: "Upcoming events",
                destination: AnyView(PlaceholderFeatureView(title: "Calendar", subtitle: "Connected to /api/v1/calendar"))
            ),
            DashboardTile(
                id: "announcements",
                title: "Announcements",
                subtitle: "Latest updates",
                destination: AnyView(PlaceholderFeatureView(title: "Announcements", subtitle: "Connected to /api/v1/announcements"))
            ),
            DashboardTile(
                id: "chat",
                title: "Chat",
                subtitle: "Message teachers",
                destination: AnyView(PlaceholderFeatureView(title: "Chat", subtitle: "Connected to /api/v1/message_threads"))
            ),
            DashboardTile(
                id: "portfolio",
                title: "Portfolio",
                subtitle: "Coming soon",
                destination: AnyView(PortfolioPlaceholderView(isFeatureEnabled: environment.portfolioLiveEnabled))
            ),
            DashboardTile(
                id: "classes",
                title: "Classes for Today",
                subtitle: "Today's schedule",
                destination: AnyView(PlaceholderFeatureView(title: "Classes", subtitle: "Connected to /api/v1/students/:id/classes_today"))
            ),
        ]
    }

    private let columns = [
        GridItem(.flexible(minimum: 140), spacing: 12),
        GridItem(.flexible(minimum: 140), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(tiles) { tile in
                        NavigationLink {
                            tile.destination
                                .navigationTitle(tile.title)
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(tile.title)
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                                Text(tile.subtitle)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, minHeight: 116, alignment: .topLeading)
                            .background(.thinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            analytics.track("dashboard_tile_tapped", metadata: ["tile": tile.id])
                            if tile.id == "portfolio" {
                                analytics.track("portfolio_tile_tapped")
                            }
                        })
                    }
                }
                .padding(16)
            }
            .navigationTitle("Student Dashboard")
        }
    }
}
