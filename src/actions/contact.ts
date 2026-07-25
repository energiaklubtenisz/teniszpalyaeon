"use server";

import { Resend } from "resend";
import { z } from "zod";

import type { ContactFormState } from "@/actions/contact-state";
import { getContactEmailConfig } from "@/lib/env";

const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Adja meg a nevét (legalább 2 karakter).")
    .max(100, "A név legfeljebb 100 karakter lehet."),
  email: z
    .string()
    .trim()
    .email("Érvényes e-mail címet adjon meg.")
    .max(200, "Az e-mail cím túl hosszú."),
  phone: z.string().trim().max(40, "A telefonszám túl hosszú."),
  message: z
    .string()
    .trim()
    .min(10, "Az üzenet legyen legalább 10 karakter.")
    .max(4000, "Az üzenet legfeljebb 4000 karakter lehet."),
  company: z.string().max(0).optional(),
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
    company: String(formData.get("company") ?? ""),
  };

  // Honeypot — treat as success so bots get no signal.
  if (raw.company.trim().length > 0) {
    return {
      status: "success",
      message: "Köszönjük! Üzenetét megkaptuk, hamarosan jelentkezünk.",
      fieldErrors: {},
    };
  }

  const parsed = contactMessageSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ContactFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "name" ||
        key === "email" ||
        key === "phone" ||
        key === "message"
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

  let emailConfig: ReturnType<typeof getContactEmailConfig>;

  try {
    emailConfig = getContactEmailConfig();
  } catch {
    return {
      status: "error",
      message:
        "Az üzenetküldés jelenleg nem elérhető. Kérjük, hívjon minket telefonon vagy írjon e-mailt közvetlenül.",
      fieldErrors: {},
    };
  }

  const { name, email, phone, message } = parsed.data;
  const phoneLine = phone ? `<p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>` : "";
  const html = `
    <h2>Új üzenet a weboldalról</h2>
    <p><strong>Név:</strong> ${escapeHtml(name)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
    ${phoneLine}
    <p><strong>Üzenet:</strong></p>
    <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
  `;

  try {
    const resend = new Resend(emailConfig.apiKey);
    const { error } = await resend.emails.send({
      from: emailConfig.from,
      to: emailConfig.to,
      replyTo: email,
      subject: `Webes üzenet — ${name}`,
      html,
      text: [
        "Új üzenet a weboldalról",
        `Név: ${name}`,
        `E-mail: ${email}`,
        phone ? `Telefon: ${phone}` : null,
        "",
        "Üzenet:",
        message,
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    });

    if (error) {
      return {
        status: "error",
        message:
          "Nem sikerült elküldeni az üzenetet. Próbálja újra később, vagy írjon nekünk e-mailt.",
        fieldErrors: {},
      };
    }
  } catch {
    return {
      status: "error",
      message:
        "Nem sikerült elküldeni az üzenetet. Próbálja újra később, vagy írjon nekünk e-mailt.",
      fieldErrors: {},
    };
  }

  return {
    status: "success",
    message: "Köszönjük! Üzenetét megkaptuk, hamarosan jelentkezünk.",
    fieldErrors: {},
  };
}
