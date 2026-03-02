import Foundation

struct AnalyticsClient {
    func track(_ eventName: String, metadata: [String: String] = [:]) {
        // Intentionally lightweight for scaffold phase. Replace with production analytics sink.
        print("[analytics] \(eventName) \(metadata)")
    }
}
