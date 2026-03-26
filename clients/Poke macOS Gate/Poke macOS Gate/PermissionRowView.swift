import SwiftUI

struct PermissionRowView: View {
    let permission: GateService.SystemPermission
    let isGranted: Bool
    let onGrant: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            iconView

            VStack(alignment: .leading, spacing: 3) {
                Text(permission.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text(permission.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            statusView
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isGranted ? Color.green.opacity(0.06) : Color.primary.opacity(0.04))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isGranted ? Color.green.opacity(0.3) : Color.primary.opacity(0.08), lineWidth: 1)
        )
        .animation(.easeInOut(duration: 0.2), value: isGranted)
    }

    private var iconView: some View {
        Image(systemName: permission.systemImageName)
            .font(.system(size: 18))
            .foregroundStyle(isGranted ? .green : .orange)
            .frame(width: 28)
    }

    @ViewBuilder
    private var statusView: some View {
        if isGranted {
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.caption)
                    .foregroundStyle(.green)
                Text("Granted")
                    .font(.caption)
                    .foregroundStyle(.green)
            }
        } else {
            Button("Grant Access", action: onGrant)
                .font(.caption)
                .buttonStyle(.bordered)
                .controlSize(.small)
        }
    }
}
