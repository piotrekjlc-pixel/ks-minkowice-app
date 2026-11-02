import SwiftUI
import UIKit
import WebKit
import GoogleCast

// Native prototype. Add GoogleCast via Swift Package Manager and set iOS bundle permissions.
@main
struct DomioNativeApp: App {
    @UIApplicationDelegateAdaptor(DomioAppDelegate.self) var delegate
    var body: some Scene {
        WindowGroup { DomioHomeView() }
    }
}

final class DomioAppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let options = GCKCastOptions(discoveryCriteria: GCKDiscoveryCriteria(applicationID: kGCKDefaultMediaReceiverApplicationID))
        GCKCastContext.setSharedInstanceWith(options)
        return true
    }
}

struct DomioWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: URL(string: "https://domio-smart-home.onrender.com")!))
        return webView
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

struct CastPicker: UIViewRepresentable {
    func makeUIView(context: Context) -> GCKUICastButton {
        let button = GCKUICastButton(frame: CGRect(x: 0, y: 0, width: 44, height: 44))
        button.tintColor = .white
        return button
    }
    func updateUIView(_ uiView: GCKUICastButton, context: Context) {}
}

@MainActor
@Observable final class NestControl {
    var message = "Wybierz Nest Mini przez przycisk Cast. iPhone musi być w tej samej sieci Wi-Fi."
    private var session: GCKCastSession? {
        GCKCastContext.sharedInstance().sessionManager.currentCastSession
    }
    func setVolume(_ value: Float) {
        guard let session else { message = "Najpierw połącz Nest Mini."; return }
        session.setDeviceVolume(value)
        message = "Wysłano ustawienie głośności: \(Int(value * 100))%."
    }
    func pause() {
        guard let client = session?.remoteMediaClient else {
            message = "Brak aktywnej zgodnej sesji multimedialnej."
            return
        }
        client.pause()
        message = "Wysłano polecenie pauzy."
    }
    func play() {
        guard let client = session?.remoteMediaClient else {
            message = "Brak aktywnej zgodnej sesji multimedialnej."
            return
        }
        client.play()
        message = "Wysłano polecenie odtwarzania."
    }
}

struct DomioHomeView: View {
    @State private var nest = NestControl()
    @State private var showNest = false
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("⌂ domio.").font(.title2.bold())
                Spacer()
                Button { showNest = true } label: {
                    Label("Nest Mini", systemImage: "hifispeaker")
                }
                CastPicker().frame(width: 44, height: 44)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .foregroundStyle(.white)
            .background(Color(red: 0.05, green: 0.09, blue: 0.17))
            DomioWebView()
        }
        .sheet(isPresented: $showNest) {
            NavigationStack {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Google Nest Mini").font(.title.bold())
                    Text(nest.message).font(.footnote)
                    HStack(spacing: 16) {
                        Button("▶ Odtwórz") { nest.play() }
                        Button("⏸ Pauza") { nest.pause() }
                    }.buttonStyle(.borderedProminent)
                    Text("Głośność głośnika").font(.headline)
                    HStack {
                        Button("−") { nest.setVolume(0.2) }
                        Button("30%") { nest.setVolume(0.3) }
                        Button("50%") { nest.setVolume(0.5) }
                        Button("+") { nest.setVolume(0.7) }
                    }.buttonStyle(.bordered)
                    Text("Uwaga: odtwarzanie i pauza działają jedynie w zgodnej sesji Google Cast. To nie jest zdalny odtwarzacz Spotify Free.").font(.caption)
                    Spacer()
                }
                .padding()
                .navigationTitle("Głośnik")
                .toolbar { Button("Zamknij") { showNest = false } }
            }
        }
    }
}
