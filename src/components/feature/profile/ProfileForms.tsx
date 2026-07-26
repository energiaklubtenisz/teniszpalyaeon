"use client";

import { useActionState } from "react";

import {
  deleteAccount,
  updatePassword,
  updateProfile,
} from "@/actions/profile";
import {
  initialDeleteAccountFormState,
  initialPasswordFormState,
  initialProfileFormState,
} from "@/actions/profile-state";
import { buttonVariants } from "@/components/ui/button";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

import styles from "./profile.module.css";

type ProfileFormsProps = {
  email: string;
  fullName: string;
  phone: string;
};

export function ProfileForms({ email, fullName, phone }: ProfileFormsProps) {
  const { fields, sections } = profile;

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    initialProfileFormState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    initialPasswordFormState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccount,
    initialDeleteAccountFormState,
  );

  const profileErrors = profileState.fieldErrors ?? {};
  const passwordErrors = passwordState.fieldErrors ?? {};
  const deleteErrors = deleteState.fieldErrors ?? {};

  return (
    <>
      <section className={styles.panel} aria-labelledby="profile-details-title">
        <h2 id="profile-details-title" className={styles.panelTitle}>
          {sections.details.title}
        </h2>
        <p className={styles.panelSupport}>{sections.details.support}</p>

        <form action={profileAction} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="profile-email" className={styles.fieldLabel}>
              {profile.emailLabel}
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              disabled
              className={cn(styles.input, styles.inputReadonly)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-full-name" className={styles.fieldLabel}>
              {fields.fullName.label}
            </label>
            <input
              id="profile-full-name"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              maxLength={100}
              defaultValue={fullName}
              disabled={profilePending}
              aria-invalid={Boolean(profileErrors.fullName)}
              aria-describedby={
                profileErrors.fullName ? "profile-full-name-error" : undefined
              }
              className={styles.input}
            />
            {profileErrors.fullName ? (
              <p
                id="profile-full-name-error"
                className={styles.fieldError}
                role="alert"
              >
                {profileErrors.fullName}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-phone" className={styles.fieldLabel}>
              {fields.phone.label}
            </label>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              placeholder={fields.phone.placeholder}
              defaultValue={phone}
              disabled={profilePending}
              aria-invalid={Boolean(profileErrors.phone)}
              aria-describedby={
                profileErrors.phone ? "profile-phone-error" : undefined
              }
              className={styles.input}
            />
            {profileErrors.phone ? (
              <p
                id="profile-phone-error"
                className={styles.fieldError}
                role="alert"
              >
                {profileErrors.phone}
              </p>
            ) : null}
          </div>

          {profileState.status === "error" && profileState.message ? (
            <p className={styles.formError} role="status">
              {profileState.message}
            </p>
          ) : null}
          {profileState.status === "success" && profileState.message ? (
            <p className={styles.formSuccess} role="status">
              {profileState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={profilePending}
            className={cn(buttonVariants({ size: "lg" }), styles.submit)}
          >
            {profilePending
              ? sections.details.submitting
              : sections.details.submit}
          </button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="profile-password-title">
        <h2 id="profile-password-title" className={styles.panelTitle}>
          {sections.password.title}
        </h2>
        <p className={styles.panelSupport}>{sections.password.support}</p>

        <form action={passwordAction} className={styles.form} noValidate>
          <div className={styles.field}>
            <label
              htmlFor="profile-current-password"
              className={styles.fieldLabel}
            >
              {fields.currentPassword.label}
            </label>
            <input
              id="profile-current-password"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              disabled={passwordPending}
              aria-invalid={Boolean(passwordErrors.currentPassword)}
              aria-describedby={
                passwordErrors.currentPassword
                  ? "profile-current-password-error"
                  : undefined
              }
              className={styles.input}
            />
            {passwordErrors.currentPassword ? (
              <p
                id="profile-current-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {passwordErrors.currentPassword}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="profile-new-password" className={styles.fieldLabel}>
              {fields.password.label}
            </label>
            <input
              id="profile-new-password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              disabled={passwordPending}
              aria-invalid={Boolean(passwordErrors.password)}
              aria-describedby={
                passwordErrors.password
                  ? "profile-new-password-error"
                  : undefined
              }
              className={styles.input}
            />
            {passwordErrors.password ? (
              <p
                id="profile-new-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {passwordErrors.password}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label
              htmlFor="profile-password-confirm"
              className={styles.fieldLabel}
            >
              {fields.passwordConfirm.label}
            </label>
            <input
              id="profile-password-confirm"
              name="passwordConfirm"
              type="password"
              required
              autoComplete="new-password"
              disabled={passwordPending}
              aria-invalid={Boolean(passwordErrors.passwordConfirm)}
              aria-describedby={
                passwordErrors.passwordConfirm
                  ? "profile-password-confirm-error"
                  : undefined
              }
              className={styles.input}
            />
            {passwordErrors.passwordConfirm ? (
              <p
                id="profile-password-confirm-error"
                className={styles.fieldError}
                role="alert"
              >
                {passwordErrors.passwordConfirm}
              </p>
            ) : null}
          </div>

          {passwordState.status === "error" && passwordState.message ? (
            <p className={styles.formError} role="status">
              {passwordState.message}
            </p>
          ) : null}
          {passwordState.status === "success" && passwordState.message ? (
            <p className={styles.formSuccess} role="status">
              {passwordState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={passwordPending}
            className={cn(buttonVariants({ size: "lg" }), styles.submit)}
          >
            {passwordPending
              ? sections.password.submitting
              : sections.password.submit}
          </button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="profile-delete-title">
        <h2 id="profile-delete-title" className={styles.panelTitle}>
          {sections.delete.title}
        </h2>
        <p className={styles.panelSupport}>{sections.delete.support}</p>

        <form action={deleteAction} className={styles.form} noValidate>
          <div className={styles.field}>
            <label
              htmlFor="profile-delete-password"
              className={styles.fieldLabel}
            >
              {fields.deletePassword.label}
            </label>
            <input
              id="profile-delete-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={deletePending}
              aria-invalid={Boolean(deleteErrors.password)}
              aria-describedby={
                deleteErrors.password
                  ? "profile-delete-password-error"
                  : undefined
              }
              className={styles.input}
            />
            {deleteErrors.password ? (
              <p
                id="profile-delete-password-error"
                className={styles.fieldError}
                role="alert"
              >
                {deleteErrors.password}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <div className={styles.checkboxRow}>
              <input
                id="profile-delete-confirm"
                name="confirm"
                type="checkbox"
                value="on"
                required
                disabled={deletePending}
                aria-invalid={Boolean(deleteErrors.confirm)}
                aria-describedby={
                  deleteErrors.confirm
                    ? "profile-delete-confirm-error"
                    : undefined
                }
                className={styles.checkbox}
              />
              <label
                htmlFor="profile-delete-confirm"
                className={styles.checkboxLabel}
              >
                {sections.delete.confirmLabel}
              </label>
            </div>
            {deleteErrors.confirm ? (
              <p
                id="profile-delete-confirm-error"
                className={styles.fieldError}
                role="alert"
              >
                {deleteErrors.confirm}
              </p>
            ) : null}
          </div>

          {deleteState.status === "error" && deleteState.message ? (
            <p className={styles.formError} role="status">
              {deleteState.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={deletePending}
            className={cn(buttonVariants({ size: "lg" }), styles.deleteSubmit)}
          >
            {deletePending
              ? sections.delete.submitting
              : sections.delete.submit}
          </button>
        </form>
      </section>
    </>
  );
}
