KS MINKOWICE – WERSJA ZE WSPÓLNĄ OBECNOŚCIĄ

Ta wersja używa Netlify Functions + Netlify Blobs.
Każdy zawodnik ma własny PIN. Odpowiedzi zapisują się wspólnie online.
Trener widzi liczbę: BĘDZIE / NIE BĘDZIE / BRAK ODPOWIEDZI.
Wtorek i czwartek są osobnymi treningami i generują się automatycznie.

WAŻNE:
Do tej wersji nie wystarczy zwykłe przeciągnięcie folderu do Netlify Drop,
bo aplikacja zawiera funkcje serwerowe i zależność @netlify/blobs.

Najprościej:
1. Rozpakuj ZIP.
2. Umieść folder w repozytorium GitHub i podłącz repo do obecnego projektu Netlify
   LUB wdroż przez Netlify CLI.
3. Netlify podczas builda zainstaluje zależności i wdroży funkcje.
4. Plik KODY_LOGOWANIA_TYLKO_DLA_TRENERA.txt zachowaj tylko dla siebie.
   Nie publikuj go jako część folderu public.

PIN trenera w tej wersji: 1987
