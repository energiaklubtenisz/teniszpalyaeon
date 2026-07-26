"use client";

import { useActionState } from "react";

import { login as loginAction } from "@/actions/auth";
import { initialLoginFormState } from "@/actions/auth-state";
import { buttonVariants } from "@/components/ui/button";
import { login } from "@/content/login";
import { cn } from "@/lib/utils";

import styles from "./login.module.css";

export function LoginForm() {
  const { fields, submit, submitting } = login;
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginFormState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="login-email" className={styles.fieldLabel}>
          {fields.email.label}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "login-email-error" : undefined
          }
          className={styles.input}
        />
        {fieldErrors.email ? (
          <p id="login-email-error" className={styles.fieldError} role="alert">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="login-password" className={styles.fieldLabel}>
          {fields.password.label}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "login-password-error" : undefined
          }
          className={styles.input}
        />
        {fieldErrors.password ? (
          <p
            id="login-password-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className={styles.formError} role="status">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={cn(buttonVariants({ size: "lg" }), styles.submit)}
      >
        {pending ? submitting : submit}
      </button>
    </form>
  );
}
