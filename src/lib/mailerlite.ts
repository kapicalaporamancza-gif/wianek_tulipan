const MAILERLITE_API_URL = "https://connect.mailerlite.com/api/subscribers";

type MailerLiteStatus = "active" | "unconfirmed";

export type MailerLiteResult = {
  subscriberId: string | null;
};

// Nowa funkcja, która szuka kluczy i w trybie DEV (Astro), i na Hostingu (Node)
function getEnv(name: string) {
  if (name === "MAILERLITE_API_KEY")
    return import.meta.env.MAILERLITE_API_KEY || process.env.MAILERLITE_API_KEY;
  if (name === "MAILERLITE_GROUP_ID")
    return (
      import.meta.env.MAILERLITE_GROUP_ID || process.env.MAILERLITE_GROUP_ID
    );
  if (name === "MAILERLITE_SUBSCRIBER_STATUS")
    return (
      import.meta.env.MAILERLITE_SUBSCRIBER_STATUS ||
      process.env.MAILERLITE_SUBSCRIBER_STATUS
    );
  return process.env[name];
}

function requiredEnvironment(name: string) {
  const value = getEnv(name)?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function getSubscriberStatus(): MailerLiteStatus {
  return getEnv("MAILERLITE_SUBSCRIBER_STATUS") === "active"
    ? "active"
    : "unconfirmed";
}

export function isMailerLiteConfigured() {
  const apiKey = getEnv("MAILERLITE_API_KEY");
  const groupId = getEnv("MAILERLITE_GROUP_ID");

  return Boolean(apiKey?.trim() && groupId?.trim());
}

export async function addSubscriberToMailerLite(
  email: string,
): Promise<MailerLiteResult> {
  const apiKey = requiredEnvironment("MAILERLITE_API_KEY");
  const groupId = requiredEnvironment("MAILERLITE_GROUP_ID");

  const response = await fetch(MAILERLITE_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      fields: {},
      groups: [groupId],
      status: getSubscriberStatus(),
      resubscribe: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `MailerLite rejected the subscription (${response.status})`,
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    data?: { id?: unknown };
  } | null;
  const subscriberId =
    typeof payload?.data?.id === "string" ? payload.data.id : null;

  return { subscriberId };
}
