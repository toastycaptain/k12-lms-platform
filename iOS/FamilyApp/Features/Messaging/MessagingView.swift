import SwiftUI

struct MessagingView: View {
    @State private var threads: [MessageThread] = []
    @State private var selectedThreadID: Int?
    @State private var messages: [ThreadMessage] = []
    @State private var draftMessage = ""

    @State private var isLoadingThreads = false
    @State private var isLoadingMessages = false
    @State private var isSending = false
    @State private var errorMessage: String?

    private let tools = MessagingTools(apiClient: APIClient(environment: .current))

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            if isLoadingThreads {
                ProgressView("Loading conversations...")
                    .frame(maxWidth: .infinity, alignment: .center)
            } else if threads.isEmpty {
                ContentUnavailableView(
                    "No conversations yet",
                    systemImage: "message",
                    description: Text("Create one in the web app compose flow, then continue here.")
                )
            } else {
                threadPicker
                Divider()
                messagePane
                composer
            }
        }
        .padding(16)
        .task {
            await loadThreads()
        }
        .onChange(of: selectedThreadID) { _, newValue in
            guard let newValue else {
                messages = []
                return
            }

            Task {
                await loadMessages(for: newValue)
            }
        }
    }

    private var threadPicker: some View {
        Picker("Conversation", selection: $selectedThreadID) {
            ForEach(threads) { thread in
                Text(threadLabel(for: thread)).tag(Optional(thread.id))
            }
        }
        .pickerStyle(.menu)
    }

    @ViewBuilder
    private var messagePane: some View {
        if selectedThreadID == nil {
            ContentUnavailableView(
                "Select a conversation",
                systemImage: "bubble.left.and.bubble.right",
                description: Text("Pick a thread above to view and send messages.")
            )
        } else if isLoadingMessages {
            ProgressView("Loading messages...")
                .frame(maxWidth: .infinity, alignment: .center)
        } else if messages.isEmpty {
            ContentUnavailableView(
                "No messages yet",
                systemImage: "bubble.left",
                description: Text("Send the first message below.")
            )
        } else {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 10) {
                    ForEach(messages) { message in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(senderName(for: message.sender))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(message.body)
                                .font(.body)
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .frame(maxHeight: 320)
        }
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("Write a message", text: $draftMessage, axis: .vertical)
                .textFieldStyle(.roundedBorder)
                .lineLimit(1...4)

            Button(isSending ? "Sending..." : "Send") {
                Task {
                    await sendMessage()
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(sendDisabled)
        }
    }

    private var sendDisabled: Bool {
        let trimmed = draftMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        return isSending || selectedThreadID == nil || trimmed.isEmpty
    }

    @MainActor
    private func loadThreads() async {
        isLoadingThreads = true
        errorMessage = nil

        do {
            let fetched = try await tools.listThreads()
            threads = fetched

            if let selectedThreadID, fetched.contains(where: { $0.id == selectedThreadID }) {
                await loadMessages(for: selectedThreadID)
            } else {
                selectedThreadID = fetched.first?.id
            }
        } catch {
            threads = []
            messages = []
            selectedThreadID = nil
            errorMessage = "Unable to load conversations."
        }

        isLoadingThreads = false
    }

    @MainActor
    private func loadMessages(for threadID: Int) async {
        isLoadingMessages = true
        errorMessage = nil

        do {
            messages = try await tools.listMessages(threadID: threadID)
        } catch {
            messages = []
            errorMessage = "Unable to load messages for this conversation."
        }

        isLoadingMessages = false
    }

    @MainActor
    private func sendMessage() async {
        guard let selectedThreadID else {
            return
        }

        let body = draftMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else {
            return
        }

        isSending = true
        errorMessage = nil

        do {
            let created = try await tools.sendMessage(threadID: selectedThreadID, body: body)
            draftMessage = ""
            messages.append(created)

            threads = try await tools.listThreads()
            if !threads.contains(where: { $0.id == selectedThreadID }) {
                self.selectedThreadID = threads.first?.id
            }
        } catch {
            errorMessage = "Unable to send message. Please try again."
        }

        isSending = false
    }

    private func threadLabel(for thread: MessageThread) -> String {
        let subject = thread.subject.isEmpty ? "Conversation \(thread.id)" : thread.subject
        if thread.unread_count > 0 {
            return "\(subject) (\(thread.unread_count))"
        }

        return subject
    }

    private func senderName(for sender: ThreadParticipant) -> String {
        "\(sender.first_name) \(sender.last_name)".trimmingCharacters(in: .whitespaces)
    }
}
