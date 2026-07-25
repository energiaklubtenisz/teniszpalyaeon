"use client";

import { useActionState } from "react";

import { sendContactMessage } from "@/actions/contact";
import { initialContactFormState } from "@/actions/contact-state";
import { buttonVariants } from "@/components/ui/button";
import { contact } from "@/content/contact";
import { cn } from "@/lib/utils";

import styles from "./contact.module.css";

export function ContactForm() {
  const { form } = contact;
  const [state, formAction, pending] = useActionState(
    sendContactMessage,
    initialContactFormState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-name" className={styles.fieldLabel}>
          {form.fields.name.label}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          maxLength={100}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={
            fieldErrors.name ? "contact-name-error" : undefined
          }
          className={styles.input}
        />
        {fieldErrors.name ? (
          <p id="contact-name-error" className={styles.fieldError} role="alert">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="contact-email" className={styles.fieldLabel}>
            {form.fields.email.label}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "contact-email-error" : undefined
            }
            className={styles.input}
          />
          {fieldErrors.email ? (
            <p
              id="contact-email-error"
              className={styles.fieldError}
              role="alert"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-phone" className={styles.fieldLabel}>
            {form.fields.phone.label}
            <span className={styles.optional}> ({form.optional})</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={
              fieldErrors.phone ? "contact-phone-error" : undefined
            }
            className={styles.input}
          />
          {fieldErrors.phone ? (
            <p
              id="contact-phone-error"
              className={styles.fieldError}
              role="alert"
            >
              {fieldErrors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.fieldLabel}>
          {form.fields.message.label}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message ? "contact-message-error" : undefined
          }
          className={styles.textarea}
        />
        {fieldErrors.message ? (
          <p
            id="contact-message-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success" ? styles.formSuccess : styles.formError
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || state.status === "success"}
        className={cn(buttonVariants({ size: "lg" }), styles.submit)}
      >
        {pending ? form.submitting : form.submit}
      </button>
    </form>
  );
}
