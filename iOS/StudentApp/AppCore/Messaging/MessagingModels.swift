import Foundation

struct ThreadParticipant: Codable, Identifiable, Equatable {
    let id: Int
    let first_name: String
    let last_name: String
    let roles: [String]
}

struct ThreadMessage: Codable, Identifiable, Equatable {
    let id: Int
    let message_thread_id: Int
    let sender_id: Int
    let body: String
    let sender: ThreadParticipant
    let created_at: String
    let updated_at: String
}

struct MessageThread: Codable, Identifiable, Equatable {
    let id: Int
    let course_id: Int?
    let course_name: String?
    let subject: String
    let thread_type: String
    let participants: [ThreadParticipant]
    let last_message: ThreadMessage?
    let messages: [ThreadMessage]?
    let unread_count: Int
    let created_at: String
    let updated_at: String
}
