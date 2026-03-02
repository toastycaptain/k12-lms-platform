import SwiftUI

private struct DashboardTile: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String
    let destination: AnyView
}

private struct DashboardTileCard: View {
    let tile: DashboardTile

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: tile.symbol)
                .font(.title3)
                .foregroundStyle(.tint)
            Text(tile.title)
                .font(.headline)
                .foregroundStyle(.primary)
            Text(tile.subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.leading)
        }
        .padding(16)
        .frame(maxWidth: .infinity, minHeight: 122, alignment: .topLeading)
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
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
                title: "To-Do",
                subtitle: "Assignments and tasks to complete",
                symbol: "checklist",
                destination: AnyView(
                    PlaceholderFeatureView(
                        title: "To-Do",
                        symbol: "checklist",
                        subtitle: "Connected to /api/v1/students/:id/todos"
                    )
                )
            ),
            DashboardTile(
                id: "goals",
                title: "Goals",
                subtitle: "Track progress toward your goals",
                symbol: "target",
                destination: AnyView(
                    PlaceholderFeatureView(
                        title: "Goals",
                        symbol: "target",
                        subtitle: "Connected to /api/v1/goals"
                    )
                )
            ),
            DashboardTile(
                id: "calendar",
                title: "Calendar",
                subtitle: "Review upcoming events and due dates",
                symbol: "calendar",
                destination: AnyView(
                    PlaceholderFeatureView(
                        title: "Calendar",
                        symbol: "calendar",
                        subtitle: "Connected to /api/v1/calendar"
                    )
                )
            ),
            DashboardTile(
                id: "announcements",
                title: "Announcements",
                subtitle: "See class and school updates",
                symbol: "megaphone",
                destination: AnyView(
                    PlaceholderFeatureView(
                        title: "Announcements",
                        symbol: "megaphone",
                        subtitle: "Connected to /api/v1/announcements"
                    )
                )
            ),
            DashboardTile(
                id: "chat",
                title: "Messages",
                subtitle: "Message your teachers",
                symbol: "message",
                destination: AnyView(MessagingView())
            ),
            DashboardTile(
                id: "portfolio",
                title: "Portfolio",
                subtitle: "Review and share your work",
                symbol: "folder",
                destination: AnyView(PortfolioPlaceholderView(isFeatureEnabled: environment.portfolioLiveEnabled))
            ),
            DashboardTile(
                id: "classes",
                title: "Classes Today",
                subtitle: "Open today's class schedule",
                symbol: "clock",
                destination: AnyView(
                    PlaceholderFeatureView(
                        title: "Classes",
                        symbol: "clock",
                        subtitle: "Connected to /api/v1/students/:id/classes_today"
                    )
                )
            )
        ]
    }

    private let columns = [
        GridItem(.adaptive(minimum: 160), spacing: 12, alignment: .top)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Today")
                    .font(.title2.weight(.semibold))
                Text("Choose a section to continue.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(tiles) { tile in
                        NavigationLink {
                            tile.destination
                                .navigationTitle(tile.title)
                                .navigationBarTitleDisplayMode(.inline)
                        } label: {
                            DashboardTileCard(tile: tile)
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint("Opens \(tile.title)")
                        .simultaneousGesture(TapGesture().onEnded {
                            analytics.track("dashboard_tile_tapped", metadata: ["tile": tile.id])
                            if tile.id == "portfolio" {
                                analytics.track("portfolio_tile_tapped")
                            }
                        })
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 20)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Home")
        .navigationBarTitleDisplayMode(.large)
    }
}
