"use client";

import { cn } from "@/lib/utils";
import { COURT_LAYOUT } from "@/lib/booking/constants";
import type { CourtOption } from "@/actions/booking";
import { booking } from "@/content/booking";

import styles from "./booking.module.css";

type CourtSchematicProps = {
  courts: CourtOption[];
  selectedCourtId: string | null;
  onSelect: (courtId: string) => void;
};

export function CourtSchematic({
  courts,
  selectedCourtId,
  onSelect,
}: CourtSchematicProps) {
  const byNumber = new Map(courts.map((court) => [court.number, court]));

  return (
    <div className={styles.schematic} role="group" aria-label={booking.steps.court.title}>
      <div className={styles.schematicFrame}>
        <p className={styles.schematicHint} aria-hidden>
          Bejárat
        </p>
        <div className={styles.courtGrid}>
          {COURT_LAYOUT.map((row) => (
            <div key={row.join("-")} className={styles.courtRow}>
              {row.map((number) => {
                const court = byNumber.get(number);
                if (!court) {
                  return (
                    <div key={number} className={styles.courtMissing}>
                      {number}
                    </div>
                  );
                }
                const selected = court.id === selectedCourtId;
                return (
                  <button
                    key={court.id}
                    type="button"
                    className={cn(styles.courtTile, selected && styles.courtTileSelected)}
                    aria-pressed={selected}
                    onClick={() => onSelect(court.id)}
                  >
                    <span className={styles.courtNumber}>{court.number}</span>
                    <span className={styles.courtName}>{court.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
