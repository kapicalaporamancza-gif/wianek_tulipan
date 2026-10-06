const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscriptionPayload = {
  name: string;
  email: string;
  consent: true;
};

export type SubscriptionValidation =
  { ok: true; value: SubscriptionPayload } | { ok: false; message: string };

export function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const name = value.trim();

  if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    return null;
  }

  return name;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim();
  const separatorIndex = email.lastIndexOf("@");

  if (
    separatorIndex <= 0 ||
    separatorIndex !== email.indexOf("@") ||
    email.length > 254
  ) {
    return null;
  }

  const localPart = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);

  if (
    localPart.length > 64 ||
    !domain.includes(".") ||
    !EMAIL_PATTERN.test(email) ||
    /[\u0000-\u001f\u007f]/.test(email)
  ) {
    return null;
  }

  return `${localPart}@${domain.toLowerCase()}`;
}

export function validateSubscription(payload: unknown): SubscriptionValidation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "Sprawdź poprawność formularza." };
  }

  const data = payload as Record<string, unknown>;

  const name = normalizeName(data.name);
  const email = normalizeEmail(data.email);

  if (!name) {
    return { ok: false, message: "Podaj swoje imię." };
  }

  if (!email) {
    return { ok: false, message: "Podaj poprawny adres e-mail." };
  }

  if (
    data.consent !== true &&
    data.consent !== "true" &&
    data.consent !== "on"
  ) {
    return {
      ok: false,
      message: "Musisz wyrazić zgodę na przesyłanie wiadomości.",
    };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      consent: true,
    },
  };
}
