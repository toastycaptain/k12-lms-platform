import SwiftUI

struct ClassDetailView: View {
    let className: String

    var body: some View {
        PlaceholderFeatureView(
            title: className,
            subtitle: "Connected to family class details endpoints"
        )
    }
}
