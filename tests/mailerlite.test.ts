import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addSubscriberToMailerLite } from '../src/lib/mailerlite';

describe('addSubscriberToMailerLite', () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    process.env.MAILERLITE_API_KEY = 'test-key';
    process.env.MAILERLITE_GROUP_ID = '123456';
    process.env.MAILERLITE_SUBSCRIBER_STATUS = 'unconfirmed';
  });

  afterEach(() => {
    process.env = originalEnvironment;
    vi.unstubAllGlobals();
  });

  it('wysyła adres do właściwej grupy z podwójnym opt-in', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'subscriber-id' } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(addSubscriberToMailerLite('test@example.com')).resolves.toEqual({
      subscriberId: 'subscriber-id',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://connect.mailerlite.com/api/subscribers',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          fields: {},
          groups: ['123456'],
          status: 'unconfirmed',
          resubscribe: false,
        }),
      }),
    );
  });
});
