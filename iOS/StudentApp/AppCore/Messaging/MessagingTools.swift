import Foundation

actor MessagingTools {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient(environment: .current)) {
        self.apiClient = apiClient
    }

    func listThreads(page: Int = 1, perPage: Int = 25) async throws -> [MessageThread] {
        let path = "/api/v1/message_threads?page=\(page)&per_page=\(perPage)"
        return try await apiClient.get(path, as: [MessageThread].self)
    }

    func listMessages(threadID: Int, page: Int = 1, perPage: Int = 50) async throws -> [ThreadMessage] {
        let path = "/api/v1/message_threads/\(threadID)/messages?page=\(page)&per_page=\(perPage)"
        return try await apiClient.get(path, as: [ThreadMessage].self)
    }

    func sendMessage(threadID: Int, body: String) async throws -> ThreadMessage {
        let payload = SendMessagePayload(body: body)
        let path = "/api/v1/message_threads/\(threadID)/messages"
        return try await apiClient.post(path, body: payload, as: ThreadMessage.self)
    }

    func createThread(
        subject: String,
        participantIDs: [Int],
        threadType: String = "direct",
        courseID: Int? = nil
    ) async throws -> MessageThread {
        let payload = CreateThreadPayload(
            course_id: courseID,
            subject: subject,
            thread_type: threadType,
            participant_ids: participantIDs
        )
        return try await apiClient.post("/api/v1/message_threads", body: payload, as: MessageThread.self)
    }
}

private struct SendMessagePayload: Encodable {
    let body: String
}

private struct CreateThreadPayload: Encodable {
    let course_id: Int?
    let subject: String
    let thread_type: String
    let participant_ids: [Int]
}
