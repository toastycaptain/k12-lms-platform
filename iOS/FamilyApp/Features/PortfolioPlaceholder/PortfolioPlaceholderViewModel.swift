import Foundation

@MainActor
final class PortfolioPlaceholderViewModel: ObservableObject {
    @Published private(set) var state: PortfolioPlaceholderState

    private let analytics: AnalyticsClient

    init(isFeatureEnabled: Bool, analytics: AnalyticsClient = AnalyticsClient()) {
        self.analytics = analytics
        self.state = PortfolioPlaceholderState(
            isFeatureEnabled: isFeatureEnabled,
            statusMessage: "Family portfolio sharing will arrive in a future update.",
            showNotifyConfirmation: false
        )
    }

    func onViewAppeared() {
        analytics.track("family_portfolio_placeholder_viewed")
    }

    func notifyTapped() {
        analytics.track("family_portfolio_notify_clicked")
        state.showNotifyConfirmation = true
    }
}
