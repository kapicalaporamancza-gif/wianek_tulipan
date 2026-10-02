import { describe, expect, it } from 'vitest';
import { normalizeEmail, validateSubscription } from '../src/lib/validation';

describe('normalizeEmail', () => {
  it('normalizuje adres bez zmiany części lokalnej', () => {
    expect(normalizeEmail('  Czytelnik@Example.COM ')).toBe(
      'Czytelnik@example.com',
    );
  });

  it.each(['', 'bez-at', 'dw@adresy@example.com', 'x@bez-kropki'])(
    'odrzuca niepoprawny adres: $value',
    (email: string) => {
      expect(normalizeEmail(email)).toBeNull();
    },
  );
});

describe('validateSubscription', () => {
  it('przyjmuje poprawny adres i wymaganą zgodę', () => {
    expect(
      validateSubscription({ email: 'Czytelnik@Example.COM', consent: true }),
    ).toEqual({
      ok: true,
      value: { email: 'Czytelnik@example.com', consent: true },
    });
  });

  it('odrzuca brak zgody', () => {
    expect(validateSubscription({ email: 'czytelnik@example.com' })).toEqual({
      ok: false,
      message: 'Musisz wyrazić zgodę na przesyłanie wiadomości.',
    });
  });
});
