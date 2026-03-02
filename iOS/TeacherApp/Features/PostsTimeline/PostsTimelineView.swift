import SwiftUI

struct PostsTimelineView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    private var sortedPosts: [TeacherPost] {
        dataStore.posts.sorted { $0.createdAt > $1.createdAt }
    }

    var body: some View {
        Group {
            if sortedPosts.isEmpty {
                PlaceholderFeatureView(
                    title: "No Posts Yet",
                    symbol: "text.bubble",
                    subtitle: "Posts you create will appear in your timeline."
                )
            } else {
                List(sortedPosts) { post in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(post.title)
                            .font(.headline)
                        Text(post.courseName)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text(post.body)
                            .font(.body)
                        Text(Self.dateFormatter.string(from: post.createdAt))
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.vertical, 6)
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Posts Timeline")
        .navigationBarTitleDisplayMode(.inline)
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()
}
