"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  Mail,
  Phone,
  Search,
  Send,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  getAvailablePlayerCandidates,
  invitePlayer,
  addCoachedPlayer,
} from "@/actions/coach";
import type { PlayerCandidate } from "@/types/coach";
import styles from "./coach.module.css";

type PlayerPickerProps = {
  onInvited: () => void;
  onClose: () => void;
};

export function PlayerPicker({ onInvited, onClose }: PlayerPickerProps) {
  const [candidates, setCandidates] = useState<PlayerCandidate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [showManualEmail, setShowManualEmail] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    const res = await getAvailablePlayerCandidates();
    if (res.success) {
      setCandidates(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)),
    );
  }, [candidates, search]);

  const handleInvite = (candidate: PlayerCandidate) => {
    setInvitingId(candidate.id);
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await invitePlayer(candidate.id);
      setInvitingId(null);
      if (res.success) {
        setSuccessMsg(
          `Felkérés sikeresen elküldve: ${candidate.fullName || candidate.email}! A kapcsolat a játékos jóváhagyása után válik aktívvá.`,
        );
        // Remove from local candidate list
        setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
        onInvited();
      } else {
        setError(res.error);
      }
    });
  };

  const handleManualInvite = () => {
    if (!manualEmail.trim()) return;
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await addCoachedPlayer(manualEmail.trim());
      if (res.success) {
        setSuccessMsg(
          `Felkérés elküldve (${manualEmail})! A játékos értesítést kapott a felkérésről.`,
        );
        setManualEmail("");
        setShowManualEmail(false);
        onInvited();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className={styles.playerPickerCard}>
      <div className={styles.playerPickerHeader}>
        <div className="flex items-center gap-2">
          <div className={styles.pickerIconWrapper}>
            <UserPlus size={18} className="text-[var(--eon-red)]" />
          </div>
          <div>
            <h3 className={styles.pickerTitle}>Játékos felkérése</h3>
            <p className={styles.pickerSubtitle}>
              Válasszon a regisztrált klubtagok közül. A felkérés elküldése után a játékosnak el kell fogadnia azt.
            </p>
          </div>
        </div>
        <button
          type="button"
          className={styles.wizardCloseBtn}
          onClick={onClose}
          title="Bezárás"
        >
          <X size={18} />
        </button>
      </div>

      {error ? <div className={styles.errorMessage}>{error}</div> : null}
      {successMsg ? <div className={styles.successMessage}>{successMsg}</div> : null}

      {/* Search Bar */}
      <div className={styles.pickerSearchRow}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} aria-hidden />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Keresés regisztrált játékos neve vagy e-mail címe alapján..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search ? (
            <button
              type="button"
              className={styles.searchClearBtn}
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Candidates List */}
      <div className={styles.candidatesListWrapper}>
        {loading ? (
          <p className={styles.pickerLoading}>Játékosok betöltése...</p>
        ) : filteredCandidates.length === 0 ? (
          <div className={styles.pickerEmptyState}>
            <Users size={28} className="text-[var(--ash)] mb-1" />
            <p className="font-medium text-[var(--ink)]">Nem található regisztrált játékos</p>
            <p className="text-[var(--smoke)] text-xs mt-0.5">
              {search
                ? "Nincs a keresési feltételnek megfelelő tag."
                : "Minden regisztrált tag már a játékosa vagy meghívást kapott."}
            </p>
            {!showManualEmail ? (
              <button
                type="button"
                className={styles.manualEmailToggleBtn}
                onClick={() => setShowManualEmail(true)}
              >
                + E-mail cím közvetlen megadása
              </button>
            ) : null}
          </div>
        ) : (
          <div className={styles.candidatesGrid}>
            {filteredCandidates.map((candidate) => {
              const isInviting = isPending && invitingId === candidate.id;
              const initials = (candidate.fullName || candidate.email || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div key={candidate.id} className={styles.candidateCard}>
                  <div className={styles.candidateAvatar}>
                    {candidate.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={candidate.avatarUrl}
                        alt=""
                        className={styles.candidateAvatarImg}
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateName}>
                      {candidate.fullName || "Névtelen játékos"}
                    </span>
                    <div className={styles.candidateMeta}>
                      {candidate.email ? (
                        <span className={styles.candidateMetaItem}>
                          <Mail size={12} />
                          {candidate.email}
                        </span>
                      ) : null}
                      {candidate.phone ? (
                        <span className={styles.candidateMetaItem}>
                          <Phone size={12} />
                          {candidate.phone}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.inviteButton}
                    disabled={isPending}
                    onClick={() => handleInvite(candidate)}
                  >
                    {isInviting ? (
                      "Küldés..."
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Meghívás</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual email invite option */}
      {showManualEmail ? (
        <div className={styles.manualEmailSection}>
          <label className={styles.fieldLabel}>Meghívás e-mail cím alapján</label>
          <div className="flex gap-2">
            <input
              type="email"
              className={styles.customInput}
              placeholder="jatekos@pelda.hu"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
            />
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isPending || !manualEmail.trim()}
              onClick={handleManualInvite}
            >
              Meghívás
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2 text-right">
          <button
            type="button"
            className={styles.manualEmailToggleBtn}
            onClick={() => setShowManualEmail(true)}
          >
            Nem találja a listában? Meghívás e-mail alapján →
          </button>
        </div>
      )}
    </div>
  );
}
