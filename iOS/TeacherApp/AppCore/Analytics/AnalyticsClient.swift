import Foundation

struct AnalyticsClient {
    func track(_ eventName: String, metadata: [String: String] = [:]) {
        print("[analytics] \(eventName) \(metadata)")
    }
}
