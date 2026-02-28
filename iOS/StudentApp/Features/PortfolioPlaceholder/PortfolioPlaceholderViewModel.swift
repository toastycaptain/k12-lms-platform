import Foundation

@MainActor
final class PortfolioPlaceholderViewModel: ObservableObject {
    @Published private(set) var state: PortfolioPlaceholderState

    private let analytics: AnalyticsClient

    init(isFeatureEnabled: Bool, analytics: AnalyticsClient = AnalyticsClient()) {
        self.analytics = analytics
        self.state = PortfolioPlaceholderState(
            isFeatureEnabled: isFeatureEnabled,
            statusMessage: "Portfolio publishing will arrive in a future update.",
            showNotifyConfirmation: false
        )
    }

    func onViewAppeared() {
        analytics.track("portfolio_placeholder_viewed")
    }

    func notifyTapped() {
        analytics.track("portfolio_notify_clicked")
        state.showNotifyConfirmation = true
    }
}
