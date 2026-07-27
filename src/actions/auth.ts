"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { LoginFormState, RegisterFormState } from "@/actions/auth-state";
import { register as registerContent } from "@/content/register";
import { createClient } from "@/lib/supabase/server";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Adja meg a teljes nevét (legalább 2 karakter).")
      .max(100, "A név legfeljebb 100 karakter lehet."),
    email: z
      .string()
      .trim()
      .email("Érvényes email címet adjon meg.")
      .max(200, "Az email cím túl hosszú."),
    password: z
      .string()
      .min(8, "A jelszó legyen legalább 8 karakter.")
      .max(72, "A jelszó legfeljebb 72 karakter lehet."),
    passwordConfirm: z.string(),
    privacyAccepted: z
      .string()
      .refine((value) => value === "on", registerContent.privacy.error),
    company: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "A két jelszó nem egyezik.",
    path: ["passwordConfirm"],
  });

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Érvényes email címet adjon meg.")
    .max(200, "Az email cím túl hosszú."),
  password: z.string().min(1, "Adja meg a jelszavát."),
});

function isDuplicateEmailError(message: string, code?: string): boolean {
  if (code === "email_exists" || code === "user_already_exists") {
    return true;
  }

  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address is already")
  );
}

function isInvalidEmailError(message: string, code?: string): boolean {
  if (code === "email_address_invalid") {
    return true;
  }

  const lower = message.toLowerCase();
  return lower.includes("email address") && lower.includes("invalid");
}

function isEmailRateLimitError(message: string, code?: string): boolean {
  if (code === "over_email_send_rate_limit") {
    return true;
  }

  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("email rate limit");
}

export async function register(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    privacyAccepted: String(formData.get("privacyAccepted") ?? ""),
    company: String(formData.get("company") ?? ""),
  };

  if (raw.company.trim().length > 0) {
    return {
      status: "idle",
      message: null,
      fieldErrors: {},
    };
  }

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: RegisterFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "fullName" ||
        key === "email" ||
        key === "password" ||
        key === "passwordConfirm" ||
        key === "privacyAccepted"
      ) {
        fieldErrors[key] ??= issue.message;
      }
    }

    return {
      status: "error",
      message: "Kérjük, javítsa a kiemelt mezőket.",
      fieldErrors,
    };
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    if (isDuplicateEmailError(error.message, error.code)) {
      return {
        status: "error",
        message: "Ez az email cím már regisztrálva van.",
        fieldErrors: { email: "Ez az email cím már regisztrálva van." },
      };
    }

    if (isInvalidEmailError(error.message, error.code)) {
      return {
        status: "error",
        message:
          "Ez az email cím nem használható. Próbáljon valódi címet (például Gmail).",
        fieldErrors: {
          email:
            "Ez az email cím nem használható. Próbáljon valódi címet (például Gmail).",
        },
      };
    }

    if (isEmailRateLimitError(error.message, error.code)) {
      return {
        status: "error",
        message:
          "Túl sok regisztrációs kísérlet. Kapcsolja ki az email megerősítést a Supabase Auth beállításokban, majd várjon egy percet és próbálja újra.",
        fieldErrors: {},
      };
    }

    return {
      status: "error",
      message: "A regisztráció nem sikerült. Próbálja újra később.",
      fieldErrors: {},
    };
  }

  // Do not leave the user signed in after registration.
  if (data.session) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/register/success");
}

export async function login(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: LoginFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "password") {
        fieldErrors[key] ??= issue.message;
      }
    }

    return {
      status: "error",
      message: "Kérjük, javítsa a kiemelt mezőket.",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: "Hibás email cím vagy jelszó.",
      fieldErrors: {},
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        "A fiók hiányos vagy törölve lett. Regisztráljon újra, vagy lépjen kapcsolatba a klubbal.",
      fieldErrors: {},
    };
  }

  revalidatePath("/", "layout");
  redirect("/booking?notice=login");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?notice=logout");
}
