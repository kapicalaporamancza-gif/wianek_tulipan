/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_PATH?: string;
  readonly MAILERLITE_API_KEY?: string;
  readonly MAILERLITE_GROUP_ID?: string;
  readonly MAILERLITE_SUBSCRIBER_STATUS?: string;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
