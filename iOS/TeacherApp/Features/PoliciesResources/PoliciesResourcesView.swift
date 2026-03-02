import SwiftUI

struct PoliciesResourcesView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    var body: some View {
        Group {
            if dataStore.resources.isEmpty {
                ContentUnavailableView(
                    "No resources available",
                    systemImage: "books.vertical",
                    description: Text("Policies and resource links will appear here.")
                )
            } else {
                List(dataStore.resources) { resource in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(resource.title)
                            .font(.headline)
                        Text(resource.category)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        if let url = URL(string: resource.url) {
                            Link(destination: url) {
                                Label(resource.url, systemImage: "link")
                                    .font(.footnote)
                            }
                        } else {
                            Text(resource.url)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Policies & Resources")
        .navigationBarTitleDisplayMode(.inline)
    }
}
