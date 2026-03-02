import SwiftUI

struct TodoListView: View {
    @EnvironmentObject private var dataStore: TeacherDataStore

    var body: some View {
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
