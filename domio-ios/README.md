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
3. Najprościej zainstalować [XcodeGen](https://github.com/yonaskolb/XcodeGen), w katalogu `domio-ios` uruchomić `xcodegen generate`, otworzyć wygenerowany `DomioNative.xcodeproj` w Xcode. Plik `project.yml` automatycznie deklaruje właściwy oficjalny pakiet Google Cast `https://github.com/googlecast/google-cast-ios-sdk` i produkt `GoogleCastDynamic` (minimum 4.8.6).
4. Wymagane uprawnienia `NSLocalNetworkUsageDescription` i usługi Bonjour są już wpisane w `project.yml`.
5. W Xcode w Signing & Capabilities wybierz własne konto Apple Development Team; podłącz iPhone i zbuduj aplikację na fizyczne urządzenie. Gdy iOS zapyta, zezwól Domio na dostęp do sieci lokalnej. iPhone i Nest Mini muszą być w tej samej sieci Wi-Fi.
6. Sprawdź listę Cast i regulację głośności na prawdziwym głośniku.

## Ograniczenia
- PWA na iOS nie może przejąć natywnego API Google Cast; potrzebna instalacja natywnej wersji.
- Spotify Free nie daje dostępu do zdalnego sterowania Spotify Web API. Cast Default Receiver nie uruchamia dowolnie chronionej sesji Spotify.
- Obecny prototyp NIE steruje Spotify Free po polsku z Domio. Nie gwarantuje sterowania Spotify odtwarzanym w oddzielnej aplikacji odbiornika.
- Weryfikacja kompilacji na Macu oraz testy na rzeczywistym Nest Mini są jeszcze potrzebne.
- Dokumentacja: https://developers.google.com/cast/docs/ios_sender/integrate

## Status realizacji
- Przygotowano kod aplikacji i definicję projektu XcodeGen; nie wykonano lokalnej kompilacji ani podpisania IPA, ponieważ środowisko nie ma Xcode i certyfikatu Apple.
- Nie przetestowano jeszcze głośnika Nest Mini ani Spotify Free; wyniki będą zależały od dostępnej sesji Cast.
- Źródło konfiguracji SDK: https://developers.google.com/cast/docs/ios_sender
