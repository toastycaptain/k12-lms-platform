import SwiftUI

private struct DashboardTile: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String
    let destination: AnyView
}

private struct FamilyClassItem: Identifiable {
    let id: String
    let studentName: String
    let className: String
    let timeRange: String
    let teacherName: String
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
    private let analytics = AnalyticsClient()
    private let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment
    }

    private var tiles: [DashboardTile] {
        [
            DashboardTile(
                id: "attendance",
                title: "Attendance",
                subtitle: "Daily attendance summary",
                symbol: "checkmark.circle",
                destination: AnyView(AttendanceView())
            ),
            DashboardTile(
                id: "assignments",
                title: "Assignments",
                subtitle: "Track student work",
                symbol: "checklist",
                destination: AnyView(AssignmentsView())
            ),
            DashboardTile(
                id: "announcements",
                title: "Announcements",
                subtitle: "School and class updates",
                symbol: "megaphone",
                destination: AnyView(AnnouncementsView())
            ),
            DashboardTile(
                id: "timetable",
                title: "Timetable",
                subtitle: "Today's class periods",
                symbol: "clock.arrow.circlepath",
                destination: AnyView(TimetableView())
            ),
            DashboardTile(
                id: "reports",
                title: "Reports",
                subtitle: "Progress and grading",
                symbol: "doc.text.magnifyingglass",
                destination: AnyView(ReportsView())
            ),
            DashboardTile(
                id: "messaging",
                title: "Messaging",
                subtitle: "Communicate with teachers",
                symbol: "message",
                destination: AnyView(MessagingView())
            ),
            DashboardTile(
                id: "portfolio",
                title: "Portfolio",
                subtitle: "Family portfolio updates",
                symbol: "folder",
                destination: AnyView(PortfolioPlaceholderView(isFeatureEnabled: environment.portfolioLiveEnabled))
            ),
            DashboardTile(
                id: "calendar",
                title: "Calendar",
                subtitle: "Events and due dates",
                symbol: "calendar",
                destination: AnyView(CalendarView())
            )
        ]
    }

    private var todaysClasses: [FamilyClassItem] {
        [
            FamilyClassItem(
                id: "class-1",
                studentName: "Avery Peterson",
                className: "Grade 7 Mathematics",
                timeRange: "8:30 AM - 9:20 AM",
                teacherName: "Ms. Nguyen"
            ),
            FamilyClassItem(
                id: "class-2",
                studentName: "Avery Peterson",
                className: "Science Lab",
                timeRange: "10:05 AM - 10:55 AM",
                teacherName: "Mr. Carter"
            ),
            FamilyClassItem(
                id: "class-3",
                studentName: "Jordan Peterson",
                className: "World History",
                timeRange: "1:10 PM - 2:00 PM",
                teacherName: "Ms. Flores"
            )
        ]
    }

    private let columns = [
        GridItem(.adaptive(minimum: 160), spacing: 12, alignment: .top)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
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
                            analytics.track("family_dashboard_tile_tapped", metadata: ["tile": tile.id])
                            if tile.id == "portfolio" {
                                analytics.track("family_portfolio_tile_tapped")
                            }
                        })
                    }
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Classes Today")
                        .font(.headline)

                    ForEach(todaysClasses) { classItem in
                        NavigationLink {
                            ClassDetailView(className: classItem.className)
                                .navigationTitle(classItem.className)
                                .navigationBarTitleDisplayMode(.inline)
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(classItem.className)
                                        .font(.headline)
                                    Text(classItem.studentName)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                    Text("\(classItem.timeRange) • \(classItem.teacherName)")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.footnote)
                                    .foregroundStyle(.tertiary)
                                    .padding(.top, 6)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .topLeading)
                            .background(Color(uiColor: .secondarySystemGroupedBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .simultaneousGesture(TapGesture().onEnded {
                            analytics.track("family_class_tapped", metadata: ["classId": classItem.id])
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
