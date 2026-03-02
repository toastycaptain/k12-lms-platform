import SwiftUI

struct ScheduleView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    private let weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

    var body: some View {
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
