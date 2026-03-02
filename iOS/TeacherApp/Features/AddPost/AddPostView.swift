import SwiftUI

struct AddPostView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore
    @State private var title = ""
    @State private var courseName = ""
    @State private var postBody = ""
    @State private var errorMessage: String?
    @State private var successMessage: String?

    var body: some View {
        Form {
            Section {
                Text("Compose an update for students and families.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Section("Post Details") {
                TextField("Post title", text: $title)
                    .textInputAutocapitalization(.sentences)
                TextField("Course (for example, Math 7)", text: $courseName)
                    .textInputAutocapitalization(.words)
            }

            Section("Message") {
                TextEditor(text: $postBody)
                    .frame(minHeight: 180)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }

            if let successMessage {
                Section {
                    Text(successMessage)
                        .font(.footnote)
                        .foregroundStyle(.green)
                }
            }
        }
        .navigationTitle("Add Post")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Publish") {
                    publishPost()
                }
                .disabled(publishDisabled)
            }
        }
    }

    private var publishDisabled: Bool {
        title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
            courseName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
            postBody.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func publishPost() {
        successMessage = nil

        guard dataStore.addPost(title: title, body: postBody, courseName: courseName) else {
            errorMessage = "Title, course, and message are required."
            return
        }

        title = ""
        courseName = ""
        postBody = ""
        errorMessage = nil
        successMessage = "Post published successfully."
    }
}
