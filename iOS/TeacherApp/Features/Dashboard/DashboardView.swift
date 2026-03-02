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
        .frame(maxWidth: .infinity, minHeight: 126, alignment: .topLeading)
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct DashboardView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    private let analytics = AnalyticsClient()
    private let environment: AppEnvironment
    private let currentUser: CurrentUserEnvelope.User
    private let tenant: CurrentUserEnvelope.Tenant?

    init(environment: AppEnvironment, currentUser: CurrentUserEnvelope.User, tenant: CurrentUserEnvelope.Tenant?) {
        self.environment = environment
        self.currentUser = currentUser
        self.tenant = tenant
    }

    private var tiles: [DashboardTile] {
        [
            DashboardTile(
                id: "timeline",
                title: "Posts Timeline",
                subtitle: "Review recent classroom updates",
                symbol: "clock.arrow.circlepath",
                destination: AnyView(PostsTimelineView())
            ),
            DashboardTile(
                id: "add_post",
                title: "Add Post",
                subtitle: "Publish a new family-facing update",
                symbol: "square.and.pencil",
                destination: AnyView(AddPostView())
            ),
            DashboardTile(
                id: "schedule",
                title: "Schedule",
                subtitle: "Check class periods and room locations",
                symbol: "calendar.badge.clock",
                destination: AnyView(ScheduleView())
            ),
            DashboardTile(
                id: "todo",
                title: "To-Do List",
                subtitle: "Track grading and planning tasks",
                symbol: "checklist",
                destination: AnyView(TodoListView())
            ),
            DashboardTile(
                id: "policies_resources",
                title: "Policies & Resources",
                subtitle: "Find school references and links",
                symbol: "building.columns",
                destination: AnyView(PoliciesResourcesView())
            ),
            DashboardTile(
                id: "messaging",
                title: "Messaging",
                subtitle: "Communicate with families and students",
                symbol: "message",
                destination: AnyView(MessagingView())
            ),
            DashboardTile(
                id: "announcements",
                title: "Announcements",
                subtitle: "Review school-wide updates",
                symbol: "megaphone",
                destination: AnyView(AnnouncementsView())
            )
        ]
    }

    private let columns = [
        GridItem(.adaptive(minimum: 160), spacing: 12, alignment: .top)
    ]

    private var teacherName: String {
        "\(currentUser.first_name) \(currentUser.last_name)".trimmingCharacters(in: .whitespaces)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Welcome, \(teacherName)")
                        .font(.title2.weight(.semibold))
                    Text(tenant?.name ?? "Teacher Workspace")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("Environment: \(environment.rawValue.uppercased())")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

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
                            analytics.track("teacher_dashboard_tile_tapped", metadata: ["tile": tile.id])
                        })
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Today")
                        .font(.headline)

                    Text("Open tasks: \(dataStore.incompleteTodoCount)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    if dataStore.todaysClasses.isEmpty {
                        ContentUnavailableView(
                            "No classes scheduled",
                            systemImage: "calendar.badge.exclamationmark",
                            description: Text("You have no classes scheduled for today.")
                        )
                        .frame(maxWidth: .infinity)
                    } else {
                        ForEach(dataStore.todaysClasses) { classItem in
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(classItem.courseName) • \(classItem.sectionName)")
                                    .font(.headline)
                                Text("\(classItem.timeRange) • \(classItem.room)")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(uiColor: .secondarySystemGroupedBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
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
