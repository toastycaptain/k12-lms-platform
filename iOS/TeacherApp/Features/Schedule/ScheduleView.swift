import SwiftUI

struct ScheduleView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    private let weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    var body: some View {
        Group {
            if dataStore.classSchedule.isEmpty {
                ContentUnavailableView(
                    "No schedule available",
                    systemImage: "calendar.badge.exclamationmark",
                    description: Text("Your schedule will appear after classes are published.")
                )
            } else {
                List {
                    ForEach(weekdayOrder, id: \.self) { day in
                        let entries = dataStore.classSchedule.filter { $0.weekday == day }
                        if !entries.isEmpty {
                            Section(day) {
                                ForEach(entries) { entry in
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("\(entry.courseName) • \(entry.sectionName)")
                                            .font(.headline)
                                        Text(entry.timeRange)
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                        Text(entry.room)
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Schedule")
        .navigationBarTitleDisplayMode(.inline)
    }
}
