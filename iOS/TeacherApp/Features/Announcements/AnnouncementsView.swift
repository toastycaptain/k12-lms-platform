import SwiftUI

struct AnnouncementsView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    var body: some View {
        List(dataStore.announcements.sorted { $0.createdAt > $1.createdAt }) { item in
            VStack(alignment: .leading, spacing: 6) {
                Text(item.title)
                    .font(.headline)
                Text(item.body)
                    .font(.body)
                Text(Self.dateFormatter.string(from: item.createdAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 6)
        }
        .listStyle(.insetGrouped)
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}
