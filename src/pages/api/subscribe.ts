import type { APIRoute } from 'astro';
import { getDatabase, type SubscriberRecord } from '../../lib/db';
import {
  addSubscriberToMailerLite,
  isMailerLiteConfigured,
} from '../../lib/mailerlite';
import { validateSubscription } from '../../lib/validation';

export const prerender = false;

async function readPayload(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  return Object.fromEntries(await request.formData());
}

function successResponse(mailerlite: boolean) {
  return Response.json(
    {
      message: 'Dziękujemy! Twój adres został zapisany.',
      mailerlite,
    },
    { status: 200 },
  );
}

export const POST: APIRoute = async ({ request }) => {
  let payload: unknown;

  try {
    payload = await readPayload(request);
  } catch {
    return Response.json(
      { message: 'Nie udało się odczytać formularza.' },
      { status: 400 },
    );
  }

  const validation = validateSubscription(payload);
  if (!validation.ok) {
    return Response.json({ message: validation.message }, { status: 400 });
  }

  const db = getDatabase();
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT * FROM subscribers WHERE email = ?')
    .get(validation.value.email) as SubscriberRecord | undefined;

  if (!existing) {
    db.prepare(
      `INSERT INTO subscribers (
         email, consent, mailerlite_status, created_at, updated_at
       ) VALUES (?, ?, 'pending', ?, ?)`,
    ).run(validation.value.email, 1, now, now);
  } else if (existing.mailerlite_status === 'synced') {
    return successResponse(true);
  }

  const subscriber = db
    .prepare('SELECT * FROM subscribers WHERE email = ?')
    .get(validation.value.email) as SubscriberRecord;

  if (!isMailerLiteConfigured()) {
    const status = import.meta.env.PROD ? 'not_configured' : 'disabled';
    db.prepare(
      `UPDATE subscribers
       SET mailerlite_status = ?, mailerlite_error = NULL, updated_at = ?
       WHERE id = ?`,
    ).run(status, now, subscriber.id);

    return successResponse(false);
  }

  try {
    const mailerlite = await addSubscriberToMailerLite(validation.value.email);
    const mailerliteStatus: SubscriberRecord['mailerlite_status'] = 'synced';
    db.prepare(
      `UPDATE subscribers
       SET mailerlite_status = ?,
           mailerlite_subscriber_id = ?,
           mailerlite_error = NULL,
           updated_at = ?
       WHERE id = ?`,
    ).run(
      mailerliteStatus,
      mailerlite.subscriberId,
      new Date().toISOString(),
      subscriber.id,
    );

    return successResponse(true);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nieznany błąd MailerLite';
    db.prepare(
      `UPDATE subscribers
       SET mailerlite_status = 'failed', mailerlite_error = ?, updated_at = ?
       WHERE id = ?`,
    ).run(message.slice(0, 500), new Date().toISOString(), subscriber.id);

    return Response.json(
      {
        message: 'Zapis lokalny działa, ale wysyłka do MailerLite chwilowo nie działa. Spróbuj ponownie.',
      },
      { status: 502 },
    );
  }
};
