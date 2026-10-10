import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addSubscriberToMailerLite, isMailerLiteConfigured } from "../src/lib/mailerlite";

describe("addSubscriberToMailerLite", () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    process.env.MAILERLITE_API_KEY = "test-key";
    process.env.MAILERLITE_GROUP_ID = "123456";
    process.env.MAILERLITE_GROUP_TULIPAN = "tulipan-group";
    process.env.MAILERLITE_GROUP_KAKTUS = "kaktus-group";
    process.env.MAILERLITE_SUBSCRIBER_STATUS = "unconfirmed";
  });

  afterEach(() => {
    process.env = originalEnvironment;
    vi.unstubAllGlobals();
  });

  it("wysyła adres do grupy wskazanej kampanii z podwójnym opt-in", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "subscriber-id" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      addSubscriberToMailerLite("test@example.com", "test", "kaktus"),
    ).resolves.toEqual({
      subscriberId: "subscriber-id",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://connect.mailerlite.com/api/subscribers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          fields: { name: "test" },
          groups: ["kaktus-group"],
          status: "unconfirmed",
          resubscribe: false,
        }),
      }),
    );
  });

  it("wybiera grupę tulipana dla kampanii tulipan", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "subscriber-id" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await addSubscriberToMailerLite("test@example.com", "test", "tulipan");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://connect.mailerlite.com/api/subscribers",
      expect.objectContaining({
        body: expect.stringContaining('"groups":["tulipan-group"]'),
      }),
    );
  });

  it("dla tulipana korzysta ze wspólnej grupy, gdy brak dedykowanej zmiennej", () => {
    process.env.MAILERLITE_GROUP_TULIPAN = "";

    expect(isMailerLiteConfigured("tulipan")).toBe(true);
  });

  it("dla kaktusa wymaga dedykowanej grupy (bez fallbacku)", () => {
    process.env.MAILERLITE_GROUP_KAKTUS = "";

    expect(isMailerLiteConfigured("kaktus")).toBe(false);
  });
});
