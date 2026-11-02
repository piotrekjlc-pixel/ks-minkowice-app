# Domio Native iOS — prototyp Google Cast

To **kod źródłowy**, nie gotowa aplikacja iPhone ani plik instalacyjny IPA.

## Architektura
- SwiftUI + WKWebView osadzający działające Domio https://domio-smart-home.onrender.com
- Oficjalny Google Cast iOS Sender SDK; natywne wykrywanie odbiorników i sesje Cast
- Natywny panel Nest Mini: wybór urządzenia, nastawienie głośności, play/pause tylko w zgodnych sesjach multimedialnych
- Nie używa ani nie ujawnia kluczy Tuya; logowanie Domio zostaje na jego serwerze

## Uruchomienie w Xcode na macOS
1. Utwórz nowy projekt **iOS App** w SwiftUI, np. `DomioNative`, z deployment target iOS 17+.
2. Zamień domyślny plik `App.swift` kodem z `DomioNativeApp.swift`.
3. W Xcode: File → Add Package Dependencies → `https://github.com/google/GoogleCastSDK-ios.git`. Wybierz odpowiedni produkt biblioteki GoogleCast według instrukcji Google.
4. W `Info.plist` dodaj `NSLocalNetworkUsageDescription`: „Domio szuka głośnika Google Nest Mini w sieci domowej.” oraz `NSBonjourServices` obejmujące `_googlecast._tcp` i `_CC1AD845._googlecast._tcp` (domyślny Cast Receiver ID; zweryfikuj aktualne wymagania SDK).
5. Włącz uprawnienia sieci lokalnej, połącz iPhone i Nest Mini z tym samym Wi-Fi, zbuduj aplikację na urządzeniu przy użyciu własnego zespołu podpisującego Apple.
6. Sprawdź listę Cast i regulację głośności na prawdziwym głośniku.

## Ograniczenia
- PWA na iOS nie może przejąć natywnego API Google Cast; potrzebna instalacja natywnej wersji.
- Spotify Free nie daje dostępu do zdalnego sterowania Spotify Web API. Cast Default Receiver nie uruchamia dowolnie chronionej sesji Spotify.
- Obecny prototyp NIE steruje Spotify Free po polsku z Domio. Nie gwarantuje sterowania Spotify odtwarzanym w oddzielnej aplikacji odbiornika.
- Weryfikacja kompilacji na Macu oraz testy na rzeczywistym Nest Mini są jeszcze potrzebne.
- Dokumentacja: https://developers.google.com/cast/docs/ios_sender/integrate
