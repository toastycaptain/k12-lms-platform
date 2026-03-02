import SwiftUI

struct AddPostView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore
    @State private var title = ""
    @State private var courseName = ""
    @State private var postBody = ""
    @State private var errorMessage: String?
    @State private var successMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text("Compose an update for students and families.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Group {
                    Text("Post Title")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("Enter title", text: $title)
                        .textFieldStyle(.roundedBorder)

                    Text("Course")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextField("Ex: Math 7", text: $courseName)
                        .textFieldStyle(.roundedBorder)

                    Text("Post Body")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    TextEditor(text: $postBody)
                        .frame(minHeight: 160)
                        .padding(8)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                if let successMessage {
                    Text(successMessage)
                        .font(.footnote)
                        .foregroundStyle(.green)
                }

                Button("Publish Post") {
                    publishPost()
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(16)
        }
    }

    private func publishPost() {
        successMessage = nil

        guard dataStore.addPost(title: title, body: postBody, courseName: courseName) else {
            errorMessage = "Title, course, and body are required."
            return
        }

        title = ""
        courseName = ""
        postBody = ""
        errorMessage = nil
        successMessage = "Post published successfully."
    }
}
