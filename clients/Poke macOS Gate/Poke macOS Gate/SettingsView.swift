import SwiftUI

struct SettingsView: View {
    @ObservedObject var service: GateService
    @State private var apiKeyInput: String = ""
    @State private var usePokeLogin: Bool = true
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 16) {
            Text("Poke Gate Settings")
                .font(.headline)

            Picker("Authentication", selection: $usePokeLogin) {
                Text("Use poke login").tag(true)
                Text("Use API key").tag(false)
            }
            .pickerStyle(.segmented)

            if usePokeLogin {
                VStack(alignment: .leading, spacing: 8) {
                    if service.hasPokeLoginCredentials {
                        Label("poke login credentials found", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.subheadline)
                    } else {
                        Label("No credentials found", systemImage: "xmark.circle")
                            .foregroundStyle(.red)
                            .font(.subheadline)

                        Text("Run this in your terminal:")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        HStack {
                            Text("npx poke login")
                                .font(.system(.caption, design: .monospaced))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.quaternary)
                                .cornerRadius(4)

                            Button {
                                NSPasteboard.general.clearContents()
                                NSPasteboard.general.setString("npx poke login", forType: .string)
                            } label: {
                                Image(systemName: "doc.on.doc")
                            }
                            .buttonStyle(.plain)
                        }

                        Text("Then come back here and click Save.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("API Key")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    SecureField("Paste your API key", text: $apiKeyInput)
                        .textFieldStyle(.roundedBorder)

                    Link("Get your key at poke.com/kitchen/api-keys",
                         destination: URL(string: "https://poke.com/kitchen/api-keys")!)
                        .font(.caption)
                        .foregroundStyle(.blue)
                }
            }

            HStack {
                Button("Cancel") {
                    dismiss()
                }
                .keyboardShortcut(.cancelAction)

                Spacer()

                Button("Save") {
                    if usePokeLogin {
                        service.authSource = .pokeLogin
                    } else {
                        service.apiKey = apiKeyInput
                        service.authSource = .apiKey
                    }
                    dismiss()
                    service.restart()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(!usePokeLogin && apiKeyInput.isEmpty)
                .disabled(usePokeLogin && !service.hasPokeLoginCredentials)
            }
        }
        .padding(20)
        .frame(width: 380)
        .onAppear {
            usePokeLogin = service.authSource != .apiKey
            apiKeyInput = service.apiKey
        }
    }
}
