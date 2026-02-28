import SwiftUI

struct PortfolioPlaceholderView: View {
    @StateObject private var viewModel: PortfolioPlaceholderViewModel

    init(isFeatureEnabled: Bool) {
        _viewModel = StateObject(wrappedValue: PortfolioPlaceholderViewModel(isFeatureEnabled: isFeatureEnabled))
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("My Portfolio")
                .font(.title)
                .fontWeight(.bold)

            Image(systemName: "tray")
                .font(.system(size: 52, weight: .light))
                .foregroundStyle(.blue)

            Text(viewModel.state.statusMessage)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            Button("Add Portfolio Entry") {}
                .buttonStyle(.borderedProminent)
                .disabled(true)

            Button("Notify me when available") {
                viewModel.notifyTapped()
            }
            .buttonStyle(.bordered)

            if viewModel.state.showNotifyConfirmation {
                Text("We will notify you when portfolio is available.")
                    .foregroundStyle(.green)
                    .font(.footnote)
            }
        }
        .padding(24)
        .onAppear {
            viewModel.onViewAppeared()
        }
    }
}
