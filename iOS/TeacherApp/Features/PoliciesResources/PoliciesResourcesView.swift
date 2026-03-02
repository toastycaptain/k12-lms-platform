import SwiftUI

struct PoliciesResourcesView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    var body: some View {
        List(dataStore.resources) { resource in
            VStack(alignment: .leading, spacing: 4) {
                Text(resource.title)
                    .font(.headline)
                Text(resource.category)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if let url = URL(string: resource.url) {
                    Link(destination: url) {
                        Text(resource.url)
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
