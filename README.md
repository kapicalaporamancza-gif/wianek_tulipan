# Wydawnictwo Wianek

Responsywna strona landing page Wydawnictwa Wianek z formularzem newslettera. Projekt łączy lokalny zapis adresów e-mail w SQLite z opcjonalną synchronizacją z MailerLite.

## Funkcje

- landing page zgodny z podaną identyfikacją wizualną:
  - tło `#fbf3de`,
  - tekst `#a85139`,
  - przyciski `#474c2c`,
  - font Andika,
- responsywny układ na telefonach, tabletach i komputerach,
- formularz zapisu do newslettera,
- walidacja adresu e-mail po stronie serwera,
- wymagana zgoda na otrzymywanie wiadomości,
- lokalna baza SQLite,
- opcjonalna synchronizacja z MailerLite,
- obsługa duplikatów bez tworzenia kolejnych rekordów,
- zapis nieudanych prób synchronizacji z możliwością ponowienia,
- testy jednostkowe i konfiguracja produkcyjnego builda Astro.

Aplikacja nie zawiera panelu administracyjnego. Adresy są przechowywane w lokalnym pliku SQLite, który można otworzyć np. w DB Browser for SQLite.

## Wymagania

- Node.js `>=20.19.0`
- npm
- dostęp do internetu podczas instalacji zależności
- konto MailerLite oraz klucz API, jeśli synchronizacja z MailerLite ma działać

Sprawdź wersję Node.js:

```powershell
node --version
npm --version
```

## Szybki start

1. Zainstaluj zależności:

   ```powershell
   npm install
   ```

2. Utwórz lokalny plik konfiguracji:

   ```powershell
   Copy-Item .env.example .env
   ```

   W systemach POSIX:

   ```bash
   cp .env.example .env
   ```

3. Uruchom serwer deweloperski:

   ```powershell
   npm run dev
   ```

4. Otwórz w przeglądarce:

   ```text
   http://localhost:4321
   ```

W trybie deweloperskim aplikacja działa także bez konfiguracji MailerLite. Nowe adresy są wtedy zapisywane lokalnie w SQLite, a formularz pokazuje komunikat sukcesu.

## Konfiguracja MailerLite

### 1. Utwórz grupę w MailerLite

W panelu MailerLite utwórz grupę, do której mają trafiać osoby zapisujące się przez landing page. Potrzebny jest jej identyfikator grupy.

### 2. Wygeneruj klucz API

W MailerLite wygeneruj klucz API w sekcji integracji/API. Klucz musi mieć uprawnienia potrzebne do zarządzania subskrybentami i grupami.

### 3. Uzupełnij `.env`

```dotenv
MAILERLITE_API_KEY=wpisz_klucz_api
MAILERLITE_GROUP_ID=wpisz_id_grupy
MAILERLITE_SUBSCRIBER_STATUS=unconfirmed
DATABASE_PATH=./data/subscribers.sqlite
```

Nie wysyłaj pliku `.env` do repozytorium ani nie umieszczaj klucza API w kodzie strony. Plik `.env` jest uwzględniony w `.gitignore`.

### Tryb subskrypcji

Domyślna wartość:

```dotenv
MAILERLITE_SUBSCRIBER_STATUS=unconfirmed
```

oznacza subskrybenta niepotwierdzonego i nadaje się do procesu double opt-in.

Ustawienie:

```dotenv
MAILERLITE_SUBSCRIBER_STATUS=active
```

powoduje natychmiastowe aktywowanie adresu w MailerLite. Używaj go wyłącznie wtedy, gdy proces zapisu i wymagane zgody są zgodne z odpowiednimi przepisami oraz polityką MailerLite.

## Zmienne środowiskowe

| Zmienna | Wymagana | Opis |
|---|---:|---|
| `MAILERLITE_API_KEY` | Nie lokalnie, tak produkcyjnie | Klucz API MailerLite przechowywany wyłącznie po stronie serwera. |
| `MAILERLITE_GROUP_ID` | Nie lokalnie, tak produkcyjnie | Identyfikator grupy MailerLite. |
| `MAILERLITE_SUBSCRIBER_STATUS` | Nie | `unconfirmed` albo `active`; domyślnie `unconfirmed`. |
| `DATABASE_PATH` | Nie | Ścieżka do pliku SQLite; domyślnie `./data/subscribers.sqlite`. |

Pełny przykład znajduje się w [.env.example](.env.example).

## Baza danych

Domyślny plik bazy:

```text
data/subscribers.sqlite
```

Pliki bazy są ignorowane przez Gita. Przy pierwszym zapisie aplikacja automatycznie tworzy katalog `data`, tabelę `subscribers` i indeks statusu MailerLite.

Tabela przechowuje:

- adres e-mail,
- potwierdzenie zgody,
- status synchronizacji z MailerLite,
- identyfikator subskrybenta MailerLite,
- ogólny komunikat ostatniego błędu,
- daty utworzenia i aktualizacji rekordu.

Adres e-mail ma unikalne ograniczenie porównujące adresy bez rozróżniania wielkości liter. Ponowny zapis tego samego adresu nie tworzy duplikatu.

## Jak działa zapis

1. Formularz wysyła e-mail i zgodę do endpointu `/api/subscribe`.
2. Serwer normalizuje adres e-mail i sprawdza, czy zgoda została wyrażona.
3. Dane są zapisywane w SQLite.
4. Jeśli skonfigurowano MailerLite, aplikacja wysyła subskrybenta do API MailerLite.
5. Po sukcesie rekord otrzymuje status `synced`.
6. Po błędzie MailerLite rekord otrzymuje status `failed`, ale pozostaje w bazie.
7. Ponowne wysłanie tego samego adresu próbuje wykonać synchronizację ponownie.

Jeżeli MailerLite nie jest skonfigurowany:

- w środowisku deweloperskim rekord dostaje status `disabled`,
- w środowisku produkcyjnym rekord dostaje status `not_configured`.

Przed uruchomieniem produkcyjnym należy skonfigurować klucze MailerLite i sprawdzić, czy subskrybenci trafiają do właściwej grupy.

## Endpoint API

```text
POST /api/subscribe
```

Przykładowe żądanie:

```bash
curl -X POST http://localhost:4321/api/subscribe \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  --data '{"email":"czytelnik@example.com","consent":true}'
```

Przykładowa odpowiedź sukcesu:

```json
{
  "message": "Dziękujemy! Twój adres został zapisany.",
  "mailerlite": true
}
```

Wartość `mailerlite: false` oznacza, że zapis lokalny się powiódł, ale synchronizacja z MailerLite nie była skonfigurowana. Błąd synchronizacji z MailerLite zwraca HTTP `502`, natomiast rekord pozostaje zapisany lokalnie.

## Testy i build

Uruchom testy:

```powershell
npm test
```

Sprawdź typy Astro/TypeScript i zbuduj aplikację:

```powershell
npm run build
```

Po poprawnym buildzie wynik znajduje się w katalogu `dist`.

Uruchom zbudowany serwer:

```powershell
npm start
```

Domyślny adres produkcyjnego procesu Node to:

```text
http://localhost:4321
```

## Wdrożenie

Projekt jest skonfigurowany jako serwer Astro z adapterem `@astrojs/node`. Nie jest to w pełni statyczny eksport, ponieważ endpoint API i SQLite wymagają środowiska wykonawczego.

Przy wdrożeniu:

1. Ustaw zmienne środowiskowe w panelu hostingu.
2. Upewnij się, że konto procesu może tworzyć i zapisywać plik bazy.
3. Skonfiguruj trwały katalog danych, który nie jest czyszczony przy każdym wdrożeniu.
4. Uruchom `npm run build`, a następnie `npm start` zgodnie z wymaganiami hostingu.
5. Sprawdź w MailerLite, czy nowy adres pojawia się w wybranej grupie.

SQLite nadaje się do lokalnego uruchomienia, VPS-a lub innego środowiska z trwałym systemem plików. Jeżeli hosting używa serverless lub tymczasowego systemu plików, przed wdrożeniem należy zastąpić SQLite bazą trwałą, np. Astro DB/libSQL albo inną zewnętrzną bazą.

## Rozwiązywanie problemów

### Formularz zapisuje lokalnie, ale nie wysyła do MailerLite

Sprawdź, czy w `.env` znajdują się poprawne wartości:

```dotenv
MAILERLITE_API_KEY=...
MAILERLITE_GROUP_ID=...
```

Po zmianie pliku `.env` uruchom serwer ponownie.

### MailerLite odrzuca subskrybenta

Sprawdź:

- czy klucz API ma wymagane uprawnienia,
- czy identyfikator grupy jest poprawny,
- czy adres e-mail jest poprawny,
- czy wybrany status `unconfirmed` lub `active` jest zgodny z konfiguracją konta,
- komunikat błędu zapisany w polu `mailerlite_error` w bazie SQLite.

### Nie widzę pliku bazy

Uruchom formularz i wyślij poprawny adres. Katalog `data` oraz plik `subscribers.sqlite` zostaną utworzone automatycznie przy pierwszym zapisie.

### Port 4321 jest już zajęty

Zatrzymaj poprzedni proces `npm run dev` lub `npm start`, a następnie uruchom serwer ponownie.

## Struktura projektu

```text
src/
  lib/
    db.ts              # SQLite i schema
    mailerlite.ts      # klient API MailerLite
    validation.ts      # walidacja danych
  pages/
    api/
      subscribe.ts     # endpoint POST /api/subscribe
    index.astro        # landing page i formularz
  styles/
    global.css         # style globalne i motywy Tailwind
tests/
  db.test.ts
  mailerlite.test.ts
  validation.test.ts
resources/             # dostarczone ilustracje i okładki
public/                # favicon
```

## Prywatność i zgody

Formularz wymaga zaznaczenia zgody przed wysłaniem danych. Przed uruchomieniem produkcyjnym dostosuj treść zgody, politykę prywatności i proces opt-in do rzeczywistych zasad Wydawnictwa Wianek oraz obowiązujących przepisów. Nie umieszczaj klucza API MailerLite w kodzie frontendu.
