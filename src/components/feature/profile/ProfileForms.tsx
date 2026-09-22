"use client";

import {
  Check,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";

import {
  deleteAccount,
  deleteAvatar,
  updatePassword,
  updateProfile,
  uploadAvatar,
} from "@/actions/profile";
import {
  initialAvatarFormState,
  initialDeleteAccountFormState,
  initialPasswordFormState,
  initialProfileFormState,
} from "@/actions/profile-state";
import { buttonVariants } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { profile } from "@/content/profile";
import { cn } from "@/lib/utils";

import styles from "./profile.module.css";

type ProfileFormsProps = {
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
};

export function ProfileForms({
  email,
  fullName,
  phone,
  avatarUrl = null,
}: ProfileFormsProps) {
  const { fields, sections, tabs, avatar } = profile;
  const [activeTab, setActiveTab] = useState<"details" | "security">("details");

  const [deletedAvatar, setDeletedAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [avatarDeleteError, setAvatarDeleteError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarState, avatarAction, avatarPending] = useActionState(
    uploadAvatar,
    initialAvatarFormState,
  );
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

  const currentAvatar = deletedAvatar
    ? null
    : avatarState.status === "success" && avatarState.avatarUrl
      ? avatarState.avatarUrl
      : (avatarUrl ?? null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDeletedAvatar(false);
    setAvatarDeleteError(null);
    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(() => {
      avatarAction(formData);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setIsDeletingAvatar(true);
    setAvatarDeleteError(null);

    try {
      const res = await deleteAvatar();
      if (res.status === "success") {
        setDeletedAvatar(true);
      } else if (res.message) {
        setAvatarDeleteError(res.message);
      }
    } catch {
      setAvatarDeleteError("A profilkép törlése nem sikerült.");
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const profileErrors = profileState.fieldErrors ?? {};
  const passwordErrors = passwordState.fieldErrors ?? {};
  const deleteErrors = deleteState.fieldErrors ?? {};

  return (
    <div className={styles.container}>
      {/* Segmented Tab Navigation */}
      <nav className={styles.tabNav} aria-label="Profil navigáció" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "details"}
          aria-controls="panel-details"
          id="tab-details"
          className={cn(
            styles.tabButton,
            activeTab === "details" && styles.tabButtonActive,
          )}
          onClick={() => setActiveTab("details")}
        >
          <User className={styles.tabIcon} aria-hidden />
          <span>{tabs.details}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "security"}
          aria-controls="panel-security"
          id="tab-security"
          className={cn(
            styles.tabButton,
            activeTab === "security" && styles.tabButtonActive,
          )}
          onClick={() => setActiveTab("security")}
        >
          <Shield className={styles.tabIcon} aria-hidden />
          <span>{tabs.security}</span>
        </button>
      </nav>

      {/* Tab 1: Personal Details & Avatar */}
      {activeTab === "details" ? (
        <div
          id="panel-details"
          role="tabpanel"
          aria-labelledby="tab-details"
          className={styles.tabContent}
        >
          {/* Avatar Management Card */}
          <section className={styles.avatarCard} aria-labelledby="avatar-section-title">
            <div className={styles.avatarCardHeader}>
              <h2 id="avatar-section-title" className={styles.panelTitle}>
                {avatar.title}
              </h2>
              <p className={styles.panelSupport}>{avatar.support}</p>
            </div>

            <div className={styles.avatarBody}>
              <div className={styles.avatarWrapper}>
                {currentAvatar ? (
                  <div className={styles.avatarImageContainer}>
                    <Image
                      src={currentAvatar}
                      alt={fullName || "Felhasználói profilkép"}
                      fill
                      unoptimized
                      className={styles.avatarImage}
                    />
                  </div>
                ) : (
                  <div className={styles.avatarPlaceholder} aria-hidden>
                    <User className={styles.avatarPlaceholderIcon} />
                  </div>
                )}
                {avatarPending || isDeletingAvatar ? (
                  <div className={styles.avatarLoadingOverlay}>
                    <span className={styles.spinner} aria-hidden />
                  </div>
                ) : null}
              </div>

              <div className={styles.avatarActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="avatar-file-input"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.hiddenFileInput}
                  onChange={handleFileChange}
                  disabled={avatarPending || isDeletingAvatar}
                />

                <div className={styles.avatarButtonsRow}>
                  <button
                    type="button"
                    disabled={avatarPending || isDeletingAvatar}
                    className={cn(buttonVariants({ size: "sm" }), styles.uploadButton)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={styles.btnIcon} aria-hidden />
                    <span>
                      {avatarPending ? avatar.uploadingButton : avatar.uploadButton}
                    </span>
                  </button>

                  {currentAvatar ? (
                    <button
                      type="button"
                      disabled={avatarPending || isDeletingAvatar}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        styles.removeAvatarButton,
                      )}
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 className={styles.btnIcon} aria-hidden />
                      <span>
                        {isDeletingAvatar ? avatar.removingButton : avatar.removeButton}
                      </span>
                    </button>
                  ) : null}
                </div>

                <p className={styles.avatarHint}>
                  Támogatott formátumok: JPG, PNG, WEBP (max. 2 MB)
                </p>
              </div>
            </div>

            {avatarState.status === "error" && avatarState.message ? (
              <p className={styles.formError} role="alert">
                {avatarState.message}
              </p>
            ) : null}
            {avatarDeleteError ? (
              <p className={styles.formError} role="alert">
                {avatarDeleteError}
              </p>
            ) : null}
            {avatarState.status === "success" && avatarState.message ? (
              <p className={styles.formSuccess} role="status">
                {avatarState.message}
              </p>
            ) : null}
          </section>

          {/* Personal Information Form */}
          <section className={styles.panel} aria-labelledby="profile-details-title">
            <div className={styles.panelHeader}>
              <h2 id="profile-details-title" className={styles.panelTitle}>
                {sections.details.title}
              </h2>
              <p className={styles.panelSupport}>{sections.details.support}</p>
            </div>

            <form action={profileAction} className={styles.form} noValidate>
              <div className={styles.fieldsGrid}>
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
                  <label
                    id="profile-phone-label"
                    htmlFor="profile-phone"
                    className={styles.fieldLabel}
                  >
                    {fields.phone.label}
                  </label>
                  <PhoneInput
                    id="profile-phone"
                    name="phone"
                    defaultValue={phone}
                    disabled={profilePending}
                    ariaInvalid={Boolean(profileErrors.phone)}
                    ariaDescribedBy={
                      profileErrors.phone ? "profile-phone-error" : undefined
                    }
                    ariaLabelledBy="profile-phone-label"
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
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label htmlFor="profile-email" className={styles.fieldLabel}>
                    {profile.emailLabel}
                  </label>
                  <span className={styles.readonlyBadge}>
                    <Lock className={styles.readonlyBadgeIcon} aria-hidden />
                    <span>{profile.emailBadge}</span>
                  </span>
                </div>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className={cn(styles.input, styles.inputReadonly)}
                />
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

              <div className={styles.submitRow}>
                <button
                  type="submit"
                  disabled={profilePending}
                  className={cn(buttonVariants({ size: "lg" }), styles.submit)}
                >
                  <Check className={styles.btnIcon} aria-hidden />
                  <span>
                    {profilePending
                      ? sections.details.submitting
                      : sections.details.submit}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : (
        /* Tab 2: Security & Account Deletion */
        <div
          id="panel-security"
          role="tabpanel"
          aria-labelledby="tab-security"
          className={styles.tabContent}
        >
          {/* Password Change Card */}
          <section className={styles.panel} aria-labelledby="profile-password-title">
            <div className={styles.panelHeader}>
              <div className={styles.panelHeaderWithIcon}>
                <div className={styles.panelHeaderIconBox}>
                  <KeyRound className={styles.panelHeaderIcon} aria-hidden />
                </div>
                <div>
                  <h2 id="profile-password-title" className={styles.panelTitle}>
                    {sections.password.title}
                  </h2>
                  <p className={styles.panelSupport}>{sections.password.support}</p>
                </div>
              </div>
            </div>

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

              <div className={styles.fieldsGrid}>
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

              <div className={styles.submitRow}>
                <button
                  type="submit"
                  disabled={passwordPending}
                  className={cn(buttonVariants({ size: "lg" }), styles.submit)}
                >
                  <KeyRound className={styles.btnIcon} aria-hidden />
                  <span>
                    {passwordPending
                      ? sections.password.submitting
                      : sections.password.submit}
                  </span>
                </button>
              </div>
            </form>
          </section>

          {/* Danger Zone: Delete Account */}
          <section className={styles.dangerCard} aria-labelledby="profile-delete-title">
            <div className={styles.dangerCardHeader}>
              <div className={styles.dangerTitleRow}>
                <span className={styles.dangerBadge}>
                  <ShieldAlert className={styles.dangerBadgeIcon} aria-hidden />
                  <span>{sections.delete.badge}</span>
                </span>
              </div>
              <h2 id="profile-delete-title" className={styles.dangerTitle}>
                {sections.delete.title}
              </h2>
              <p className={styles.dangerSupport}>{sections.delete.support}</p>
            </div>

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

              <div className={styles.submitRow}>
                <button
                  type="submit"
                  disabled={deletePending}
                  className={cn(buttonVariants({ size: "lg" }), styles.deleteSubmit)}
                >
                  <Trash2 className={styles.btnIcon} aria-hidden />
                  <span>
                    {deletePending
                      ? sections.delete.submitting
                      : sections.delete.submit}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
