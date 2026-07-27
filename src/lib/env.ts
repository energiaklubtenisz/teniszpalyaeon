import { z } from "zod";

const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  })
  .refine(
    (env) =>
      Boolean(
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    {
      message:
        "Either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required",
    },
  );

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CONTACT_TO_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().optional(),
  ),
  CONTACT_FROM_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

function parsePublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

function parseServerEnv() {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
  });
}

export function getSupabasePublishableKey(): string {
  const env = parsePublicEnv();
  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("Supabase publishable key is not configured");
  }

  return key;
}

export function getSupabaseUrl(): string {
  return parsePublicEnv().NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return parseServerEnv().SUPABASE_SERVICE_ROLE_KEY;
}

export function getContactEmailConfig(): {
  apiKey: string;
  to: string;
  from: string;
} {
  const env = parseServerEnv();

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    throw new Error("Contact email is not configured");
  }

  return {
    apiKey: env.RESEND_API_KEY,
    to: env.CONTACT_TO_EMAIL,
    from: env.CONTACT_FROM_EMAIL,
  };
}
