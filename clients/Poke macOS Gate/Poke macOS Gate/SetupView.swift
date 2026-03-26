import SwiftUI

struct SetupView: View {
    @ObservedObject var service: GateService
    @State private var selectedMode: GateService.PermissionMode

    init(service: GateService) {
        self.service = service
        _selectedMode = State(initialValue: service.permissionMode)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("First-time setup")
                .font(.headline)

            Text("Choose your default access mode and review macOS permission prompts before connecting the gate.")
                .font(.caption)
                .foregroundStyle(.secondary)

            VStack(spacing: 8) {
                ForEach(GateService.PermissionMode.allCases) { mode in
                    modeRow(mode)
                }
            }

            if selectedMode == .full {
                AccessibilityPermissionView(service: service)
            }

            HStack {
                Spacer()
                Button("Continue") {
                    service.completeFirstRunSetup(selectedMode: selectedMode, requestPermissions: false)
                }
                .keyboardShortcut(.defaultAction)
                .disabled(selectedMode == .full && !service.hasSystemPermissionsGranted)
            }
        }
        .padding(16)
        .frame(width: 360)
        .onAppear {
            service.refreshSystemPermissions()
        }
    }

    private func modeRow(_ mode: GateService.PermissionMode) -> some View {
        Button {
            selectedMode = mode
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: selectedMode == mode ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selectedMode == mode ? Color.accentColor : Color.secondary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(mode.title)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                    Text(mode.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .padding(10)
            .background(selectedMode == mode ? Color.accentColor.opacity(0.1) : Color.primary.opacity(0.04))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(selectedMode == mode ? Color.accentColor.opacity(0.4) : Color.clear, lineWidth: 1)
            )
            .cornerRadius(10)
        }
        .buttonStyle(.plain)
    }
}
