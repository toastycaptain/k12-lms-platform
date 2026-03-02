import SwiftUI

struct PlaceholderFeatureView: View {
    let title: String
    let symbol: String
    let subtitle: String

    init(title: String, symbol: String = "square.grid.2x2", subtitle: String) {
        self.title = title
        self.symbol = symbol
        self.subtitle = subtitle
    }

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: symbol)
        } description: {
            Text(subtitle)
                .font(.body)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(uiColor: .systemGroupedBackground))
    }
}
