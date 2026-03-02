import SwiftUI

private struct DashboardTile: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String
    let destination: AnyView
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
                subtitle: "View posts you have made",
                symbol: "clock.arrow.circlepath",
                destination: AnyView(PostsTimelineView())
            ),
            DashboardTile(
                id: "add_post",
                title: "Add Post",
                subtitle: "Publish an educator update",
                symbol: "square.and.pencil",
                destination: AnyView(AddPostView())
            ),
            DashboardTile(
                id: "schedule",
                title: "Schedule",
                subtitle: "Check class periods",
                symbol: "calendar.badge.clock",
                destination: AnyView(ScheduleView())
            ),
            DashboardTile(
                id: "todo",
                title: "To-Do List",
                subtitle: "Track daily work",
                symbol: "checklist",
                destination: AnyView(TodoListView())
            ),
            DashboardTile(
                id: "policies_resources",
                title: "Policies & Resources",
                subtitle: "School references",
                symbol: "building.columns",
                destination: AnyView(PoliciesResourcesView())
            ),
            DashboardTile(
                id: "messaging",
                title: "Messaging",
                subtitle: "Secure parent/student messaging",
                symbol: "message",
                destination: AnyView(MessagingView())
            ),
            DashboardTile(
                id: "announcements",
                title: "Announcements",
                subtitle: "School-wide updates",
                symbol: "megaphone",
                destination: AnyView(AnnouncementsView())
            )
        ]
    }

    private let columns = [
        GridItem(.flexible(minimum: 140), spacing: 12),
        GridItem(.flexible(minimum: 140), spacing: 12)
    ]

    private var teacherName: String {
        "\(currentUser.first_name) \(currentUser.last_name)".trimmingCharacters(in: .whitespaces)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome, \(teacherName)")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text(tenant?.name ?? "Teacher Workspace")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Environment: \(environment.rawValue.uppercased())")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }

                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(tiles) { tile in
                            NavigationLink {
                                tile.destination
                                    .navigationTitle(tile.title)
                            } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    Image(systemName: tile.symbol)
                                        .font(.title3)
                                        .foregroundStyle(.blue)
                                    Text(tile.title)
                                        .font(.headline)
                                        .foregroundStyle(.primary)
                                    Text(tile.subtitle)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(14)
                                .frame(maxWidth: .infinity, minHeight: 128, alignment: .topLeading)
                                .background(.thinMaterial)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                analytics.track("teacher_dashboard_tile_tapped", metadata: ["tile": tile.id])
                            })
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Today")
                            .font(.title3)
                            .fontWeight(.semibold)

                        Text("Open tasks: \(dataStore.incompleteTodoCount)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        if dataStore.todaysClasses.isEmpty {
                            Text("No classes scheduled for today.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        } else {
                            ForEach(dataStore.todaysClasses) { classItem in
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("\(classItem.courseName) • \(classItem.sectionName)")
                                        .font(.headline)
                                    Text("\(classItem.timeRange) • \(classItem.room)")
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }
                }
                .padding(16)
            }
            .navigationTitle("Teacher Dashboard")
        }
    }
}
