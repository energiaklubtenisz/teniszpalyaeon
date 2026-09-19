"use client";

import { useState, useTransition } from "react";
import { Plus, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react";

import { addSeasonPass, type RegisteredUserCandidate } from "@/actions/admin";
import { adminContent } from "@/content/admin";

import styles from "./admin.module.css";

type AddSeasonPassFormProps = {
  candidates: RegisteredUserCandidate[];
  onAdded?: () => void;
};

export function AddSeasonPassForm({
  candidates,
  onAdded,
}: AddSeasonPassFormProps) {
  const { addForm } = adminContent.seasonPass;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(addForm.errors.invalidEmail);
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await addSeasonPass(cleanEmail);
      if (!result.success) {
        setError(result.error);
      } else {
        const msg = result.data.isRegistered
          ? addForm.success.registered.replace("{email}", result.data.email)
          : addForm.success.pending.replace("{email}", result.data.email);
        setSuccess(msg);
        setEmail("");
        onAdded?.();
      }
    });
  };

  const selectCandidate = (candEmail: string) => {
    setEmail(candEmail);
    setError(null);
    setSuccess(null);
  };

  return (
    <section className={styles.panel} aria-labelledby="add-season-pass-heading">
      <h2 id="add-season-pass-heading" className={styles.panelTitle}>
        {addForm.title}
      </h2>
      <p className={styles.panelSupport}>{addForm.support}</p>

      {success && (
        <div className={styles.alertSuccess} role="status">
          <CheckCircle2 size={16} aria-hidden />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className={styles.alertError} role="alert">
          <AlertCircle size={16} aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.formRow}>
          <div className={styles.inputWrapper}>
            <label htmlFor="season-pass-email-input" className={styles.label}>
              {addForm.emailLabel}
            </label>
            <input
              id="season-pass-email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder={addForm.emailPlaceholder}
              disabled={isPending}
              className={styles.input}
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className={styles.submitBtn}
          >
            <Plus size={16} aria-hidden />
            <span>
              {isPending ? addForm.submittingButton : addForm.submitButton}
            </span>
          </button>
        </div>

        {candidates.length > 0 && (
          <div className={styles.candidateSection}>
            <span className={styles.candidateLabel}>
              {addForm.registeredSuggestionsLabel}
            </span>
            <div className={styles.candidatePills}>
              {candidates.map((cand) => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => selectCandidate(cand.email)}
                  className={styles.candidatePill}
                  title={`Email cím kitöltése: ${cand.email}`}
                >
                  <UserCheck size={12} aria-hidden />
                  <span>
                    {cand.fullName ? `${cand.fullName} (${cand.email})` : cand.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
