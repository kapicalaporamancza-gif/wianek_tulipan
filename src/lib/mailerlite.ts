import type { Campaign } from "./validation";

const MAILERLITE_API_URL = "https://connect.mailerlite.com/api/subscribers";

type MailerLiteStatus = "active" | "unconfirmed";

export type MailerLiteResult = {
  subscriberId: string | null;
};

// Zmienna środowiskowa z ID grupy dla danej kampanii.
const GROUP_ENV_BY_CAMPAIGN: Record<Campaign, string> = {
  tulipan: "MAILERLITE_GROUP_TULIPAN",
  kaktus: "MAILERLITE_GROUP_KAKTUS",
};

// Nowa funkcja, która szuka kluczy i w trybie DEV (Astro), i na Hostingu (Node)
function getEnv(name: string) {
  if (name === "MAILERLITE_API_KEY")
    return import.meta.env.MAILERLITE_API_KEY || process.env.MAILERLITE_API_KEY;
  if (name === "MAILERLITE_GROUP_ID")
    return (
      import.meta.env.MAILERLITE_GROUP_ID || process.env.MAILERLITE_GROUP_ID
    );
  if (name === "MAILERLITE_GROUP_TULIPAN")
    return (
      import.meta.env.MAILERLITE_GROUP_TULIPAN ||
      process.env.MAILERLITE_GROUP_TULIPAN
    );
  if (name === "MAILERLITE_GROUP_KAKTUS")
    return (
      import.meta.env.MAILERLITE_GROUP_KAKTUS ||
      process.env.MAILERLITE_GROUP_KAKTUS
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

// ID grupy dla kampanii.
export function resolveGroupId(campaign: Campaign): string | null {
  const campaignGroup = getEnv(GROUP_ENV_BY_CAMPAIGN[campaign])?.trim();
  if (campaignGroup) return campaignGroup;

  // Zgodność wsteczna: strona tulipan działała wcześniej na wspólnym
  // MAILERLITE_GROUP_ID. Dla kaktusa wymagamy dedykowanej grupy — inaczej
  // zapisy po cichu trafiłyby do automatyzacji tulipana.
  if (campaign === "tulipan") {
    return getEnv("MAILERLITE_GROUP_ID")?.trim() || null;
  }

  return null;
}

function getSubscriberStatus(): MailerLiteStatus {
  return getEnv("MAILERLITE_SUBSCRIBER_STATUS") === "active"
    ? "active"
    : "unconfirmed";
}

export function isMailerLiteConfigured(campaign: Campaign) {
  const apiKey = getEnv("MAILERLITE_API_KEY");

  return Boolean(apiKey?.trim() && resolveGroupId(campaign));
}

export async function addSubscriberToMailerLite(
  email: string,
  name: string,
  campaign: Campaign,
): Promise<MailerLiteResult> {
  const apiKey = requiredEnvironment("MAILERLITE_API_KEY");
  const groupId = resolveGroupId(campaign);

  if (!groupId) {
    throw new Error(`${GROUP_ENV_BY_CAMPAIGN[campaign]} is not configured`);
  }

  const response = await fetch(MAILERLITE_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      fields: {
        name,
      },
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
