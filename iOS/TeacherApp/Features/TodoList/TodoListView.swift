import SwiftUI

struct TodoListView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    var body: some View {
        Group {
            if dataStore.todos.isEmpty {
                ContentUnavailableView(
                    "No tasks assigned",
                    systemImage: "checklist",
                    description: Text("Tasks from your workflow will appear here.")
                )
            } else {
                List {
                    Section("Open Tasks") {
                        ForEach(dataStore.todos) { todo in
                            HStack(spacing: 10) {
                                Button {
                                    dataStore.toggleTodo(id: todo.id)
                                } label: {
                                    Image(systemName: todo.isComplete ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(todo.isComplete ? .green : .secondary)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel(todo.isComplete ? "Mark incomplete" : "Mark complete")

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(todo.title)
                                        .strikethrough(todo.isComplete)
                                        .foregroundStyle(todo.isComplete ? .secondary : .primary)
                                    Text(todo.dueLabel)
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle("Tasks")
        .navigationBarTitleDisplayMode(.inline)
    }
}
