import SwiftUI

struct PortfolioPlaceholderView: View {
    @StateObject private var viewModel: PortfolioPlaceholderViewModel

    init(isFeatureEnabled: Bool) {
        _viewModel = StateObject(wrappedValue: PortfolioPlaceholderViewModel(isFeatureEnabled: isFeatureEnabled))
    }

    var body: some View {
        ContentUnavailableView {
            Label("Portfolio", systemImage: "folder")
        } description: {
            Text(viewModel.state.statusMessage)
                .multilineTextAlignment(.center)
        } actions: {
            Button("Add Portfolio Entry") {}
                .buttonStyle(.borderedProminent)
                .disabled(!viewModel.state.isFeatureEnabled)

            Button("Notify me when available") {
                viewModel.notifyTapped()
            }
            .buttonStyle(.bordered)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Portfolio")
        .navigationBarTitleDisplayMode(.inline)
        .alert("You're on the list", isPresented: notifyAlertBinding) {
            Button("OK", role: .cancel) {
                viewModel.dismissNotificationConfirmation()
            }
        } message: {
            Text("We will notify you when portfolio is available.")
        }
        .onAppear {
            viewModel.onViewAppeared()
        }
    }

    private var notifyAlertBinding: Binding<Bool> {
        Binding(
            get: { viewModel.state.showNotifyConfirmation },
            set: { newValue in
                if !newValue {
                    viewModel.dismissNotificationConfirmation()
                }
            }
        )
    }
}
