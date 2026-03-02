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
                subtitle: "Today\'s class periods",
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
                subtitle: "Placeholder",
                symbol: "tray",
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
        GridItem(.flexible(minimum: 140), spacing: 12),
        GridItem(.flexible(minimum: 140), spacing: 12)
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
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
                                analytics.track("family_dashboard_tile_tapped", metadata: ["tile": tile.id])
                                if tile.id == "portfolio" {
                                    analytics.track("family_portfolio_tile_tapped")
                                }
                            })
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("Classes Today")
                            .font(.title3)
                            .fontWeight(.semibold)

                        ForEach(todaysClasses) { classItem in
                            NavigationLink {
                                ClassDetailView(className: classItem.className)
                                .navigationTitle(classItem.className)
                            } label: {
                                HStack(alignment: .top, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(classItem.className)
                                            .font(.headline)
                                        Text(classItem.studentName)
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                        Text("\(classItem.timeRange) • \(classItem.teacherName)")
                                            .font(.footnote)
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
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .buttonStyle(.plain)
                            .simultaneousGesture(TapGesture().onEnded {
                                analytics.track("family_class_tapped", metadata: ["classId": classItem.id])
                            })
                        }
                    }
                }
                .padding(16)
            }
            .navigationTitle("Family Dashboard")
        }
    }
}
