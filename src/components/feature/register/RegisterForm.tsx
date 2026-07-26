"use client";

import { useActionState } from "react";

import { register as registerAction } from "@/actions/auth";
import { initialRegisterFormState } from "@/actions/auth-state";
import { buttonVariants } from "@/components/ui/button";
import { register } from "@/content/register";
import { cn } from "@/lib/utils";

import styles from "./register.module.css";

export function RegisterForm() {
  const { fields, submit, submitting } = register;
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialRegisterFormState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="register-company">Company</label>
        <input
          id="register-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="register-fullName" className={styles.fieldLabel}>
          {fields.fullName.label}
        </label>
        <input
          id="register-fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          maxLength={100}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.fullName)}
          aria-describedby={
            fieldErrors.fullName ? "register-fullName-error" : undefined
          }
          className={styles.input}
        />
        {fieldErrors.fullName ? (
          <p
            id="register-fullName-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.fullName}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-email" className={styles.fieldLabel}>
          {fields.email.label}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={200}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "register-email-error" : undefined
          }
          className={styles.input}
        />
        {fieldErrors.email ? (
          <p
            id="register-email-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-password" className={styles.fieldLabel}>
          {fields.password.label}
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "register-password-error" : undefined
          }
          className={styles.input}
        />
        {fieldErrors.password ? (
          <p
            id="register-password-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label
          htmlFor="register-passwordConfirm"
          className={styles.fieldLabel}
        >
          {fields.passwordConfirm.label}
        </label>
        <input
          id="register-passwordConfirm"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.passwordConfirm)}
          aria-describedby={
            fieldErrors.passwordConfirm
              ? "register-passwordConfirm-error"
              : undefined
          }
          className={styles.input}
        />
        {fieldErrors.passwordConfirm ? (
          <p
            id="register-passwordConfirm-error"
            className={styles.fieldError}
            role="alert"
          >
            {fieldErrors.passwordConfirm}
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
