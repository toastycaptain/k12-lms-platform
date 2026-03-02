import Foundation

struct TeacherPost: Identifiable {
    let id: UUID
    let title: String
    let body: String
    let courseName: String
    let createdAt: Date
}

struct TeacherClassSession: Identifiable {
    let id: UUID
    let weekday: String
    let courseName: String
    let sectionName: String
    let timeRange: String
    let room: String
}

struct TeacherTodoItem: Identifiable {
    let id: UUID
    let title: String
    let dueLabel: String
    var isComplete: Bool
}

struct TeacherResource: Identifiable {
    let id: UUID
    let title: String
    let category: String
    let url: String
}

struct TeacherAnnouncementItem: Identifiable {
    let id: UUID
    let title: String
    let body: String
    let createdAt: Date
}

@MainActor
final class TeacherDataStore: ObservableObject {
    @Published private(set) var posts: [TeacherPost] = [
        TeacherPost(
            id: UUID(),
            title: "Unit 4 Launch Reminder",
            body: "Kicking off Unit 4 tomorrow. Students should bring calculators and notebooks.",
            courseName: "Math 7",
            createdAt: Date().addingTimeInterval(-60 * 60 * 3)
        ),
        TeacherPost(
            id: UUID(),
            title: "Lab Safety Checkpoint",
            body: "Please complete the digital lab safety quiz before next period.",
            courseName: "Science 8",
            createdAt: Date().addingTimeInterval(-60 * 60 * 26)
        )
    ]

    @Published private(set) var classSchedule: [TeacherClassSession] = [
        TeacherClassSession(id: UUID(), weekday: "Monday", courseName: "Math 7", sectionName: "Period 1", timeRange: "8:10 AM - 9:00 AM", room: "Room 204"),
        TeacherClassSession(id: UUID(), weekday: "Monday", courseName: "Advisory", sectionName: "Homeroom", timeRange: "9:10 AM - 9:40 AM", room: "Room 204"),
        TeacherClassSession(id: UUID(), weekday: "Tuesday", courseName: "Math 7", sectionName: "Period 2", timeRange: "10:00 AM - 10:50 AM", room: "Room 204"),
        TeacherClassSession(id: UUID(), weekday: "Wednesday", courseName: "Science 8", sectionName: "Period 4", timeRange: "1:00 PM - 1:50 PM", room: "Lab 3"),
        TeacherClassSession(id: UUID(), weekday: "Thursday", courseName: "Math 7", sectionName: "Period 5", timeRange: "2:00 PM - 2:50 PM", room: "Room 204"),
        TeacherClassSession(id: UUID(), weekday: "Friday", courseName: "Science 8", sectionName: "Period 3", timeRange: "11:00 AM - 11:50 AM", room: "Lab 3")
    ]

    @Published private(set) var todos: [TeacherTodoItem] = [
        TeacherTodoItem(id: UUID(), title: "Grade quiz submissions", dueLabel: "Due today", isComplete: false),
        TeacherTodoItem(id: UUID(), title: "Publish next week lesson outline", dueLabel: "Due tomorrow", isComplete: false),
        TeacherTodoItem(id: UUID(), title: "Family conference notes", dueLabel: "Due Friday", isComplete: true)
    ]

    @Published private(set) var resources: [TeacherResource] = [
        TeacherResource(id: UUID(), title: "Faculty Handbook", category: "Policy", url: "https://example.edu/faculty-handbook"),
        TeacherResource(id: UUID(), title: "Assessment Playbook", category: "Resource", url: "https://example.edu/assessment-playbook"),
        TeacherResource(id: UUID(), title: "Behavior Protocol", category: "Policy", url: "https://example.edu/behavior-protocol")
    ]

    @Published private(set) var announcements: [TeacherAnnouncementItem] = [
        TeacherAnnouncementItem(
            id: UUID(),
            title: "Staff Meeting Update",
            body: "Thursday staff meeting moved to 3:45 PM in the media center.",
            createdAt: Date().addingTimeInterval(-60 * 45)
        ),
        TeacherAnnouncementItem(
            id: UUID(),
            title: "Progress Report Window",
            body: "Progress report submissions close this Friday at 5:00 PM.",
            createdAt: Date().addingTimeInterval(-60 * 60 * 18)
        )
    ]

    var incompleteTodoCount: Int {
        todos.filter { !$0.isComplete }.count
    }

    var todaysClasses: [TeacherClassSession] {
        let weekday = Self.weekdayFormatter.string(from: Date())
        return classSchedule.filter { $0.weekday == weekday }
    }

    @discardableResult
    func addPost(title: String, body: String, courseName: String) -> Bool {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedBody = body.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedCourse = courseName.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedTitle.isEmpty, !trimmedBody.isEmpty, !trimmedCourse.isEmpty else {
            return false
        }

        posts.insert(
            TeacherPost(
                id: UUID(),
                title: trimmedTitle,
                body: trimmedBody,
                courseName: trimmedCourse,
                createdAt: Date()
            ),
            at: 0
        )
        return true
    }

    func toggleTodo(id: UUID) {
        guard let index = todos.firstIndex(where: { $0.id == id }) else { return }
        todos[index].isComplete.toggle()
    }

    private static let weekdayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        formatter.dateFormat = "EEEE"
        return formatter
    }()
}
