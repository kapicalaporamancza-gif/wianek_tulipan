import { describe, expect, it } from 'vitest';
import {
  normalizeCampaign,
  normalizeEmail,
  validateSubscription,
} from '../src/lib/validation';

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

describe('normalizeCampaign', () => {
  it('domyślnie zwraca tulipan dla pustej wartości', () => {
    expect(normalizeCampaign(undefined)).toBe('tulipan');
    expect(normalizeCampaign('')).toBe('tulipan');
  });

  it('rozpoznaje kampanie i odrzuca nieznane', () => {
    expect(normalizeCampaign('KAKTUS')).toBe('kaktus');
    expect(normalizeCampaign('tulipan')).toBe('tulipan');
    expect(normalizeCampaign('roza')).toBeNull();
  });
});

describe('validateSubscription', () => {
  it('przyjmuje poprawny adres i wymaganą zgodę', () => {
    expect(
      validateSubscription({
        name: 'Czytelnik',
        email: 'Czytelnik@Example.COM',
        consent: true,
        campaign: 'kaktus',
      }),
    ).toEqual({
      ok: true,
      value: {
        name: 'Czytelnik',
        email: 'Czytelnik@example.com',
        consent: true,
        campaign: 'kaktus',
      },
    });
  });

  it('przypisuje kampanię domyślną, gdy pole jest pominięte', () => {
    expect(
      validateSubscription({
        name: 'Czytelnik',
        email: 'czytelnik@example.com',
        consent: true,
      }),
    ).toEqual({
      ok: true,
      value: {
        name: 'Czytelnik',
        email: 'czytelnik@example.com',
        consent: true,
        campaign: 'tulipan',
      },
    });
  });

  it('odrzuca brak zgody', () => {
    expect(
      validateSubscription({
        name: 'Czytelnik',
        email: 'czytelnik@example.com',
      }),
    ).toEqual({
      ok: false,
      message: 'Musisz wyrazić zgodę na przesyłanie wiadomości.',
    });
  });

  it('odrzuca nieznaną kampanię', () => {
    expect(
      validateSubscription({
        name: 'Czytelnik',
        email: 'czytelnik@example.com',
        consent: true,
        campaign: 'roza',
      }),
    ).toEqual({
      ok: false,
      message: 'Sprawdź poprawność formularza.',
    });
  });
});
