"use client";

import { cn } from "@/lib/utils";
import { COURT_LAYOUT } from "@/lib/booking/constants";
import type { CourtOption } from "@/actions/booking";
import { booking } from "@/content/booking";

import styles from "./booking.module.css";

type CourtSchematicProps = {
  courts: CourtOption[];
  selectedCourtId: string | null;
  availabilityByCourtId: Record<string, boolean>;
  onSelect: (courtId: string) => void;
};

function CourtSurface({ number }: { number: number }) {
  return (
    <svg
      className={styles.courtSurface}
      viewBox="0 0 100 140"
      aria-hidden
      focusable="false"
    >
      <rect className={styles.courtClay} x="3" y="3" width="94" height="134" rx="2" />
      {/* Doubles court outline */}
      <rect className={styles.courtLines} x="10" y="10" width="80" height="120" fill="none" />
      {/* Singles sidelines */}
      <line className={styles.courtLines} x1="18" y1="10" x2="18" y2="130" />
      <line className={styles.courtLines} x1="82" y1="10" x2="82" y2="130" />
      {/* Service boxes */}
      <line className={styles.courtLines} x1="18" y1="42" x2="82" y2="42" />
      <line className={styles.courtLines} x1="18" y1="98" x2="82" y2="98" />
      <line className={styles.courtLines} x1="50" y1="42" x2="50" y2="98" />
      {/* Net */}
      <line className={styles.courtNet} x1="6" y1="70" x2="94" y2="70" />
      <text className={styles.courtSvgNumber} x="50" y="76" textAnchor="middle">
        {number}
      </text>
    </svg>
  );
}

export function CourtSchematic({
  courts,
  selectedCourtId,
  availabilityByCourtId,
  onSelect,
}: CourtSchematicProps) {
  const byNumber = new Map(courts.map((court) => [court.number, court]));

  return (
    <div className={styles.schematic} role="group" aria-label={booking.steps.court.title}>
      <div className={styles.legend}>
        <span>
          <i className={cn(styles.swatch, styles.swatchCourtFree)} />{" "}
          {booking.steps.court.available}
        </span>
        <span>
          <i className={cn(styles.swatch, styles.swatchCourtBusy)} />{" "}
          {booking.steps.court.busy}
        </span>
      </div>

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
                      <CourtSurface number={number} />
                    </div>
                  );
                }

                const available = availabilityByCourtId[court.id] === true;
                const selected = court.id === selectedCourtId;

                return (
                  <button
                    key={court.id}
                    type="button"
                    disabled={!available}
                    className={cn(
                      styles.courtTile,
                      available ? styles.courtTileFree : styles.courtTileBusy,
                      selected && styles.courtTileSelected,
                    )}
                    aria-pressed={selected}
                    aria-label={`${court.name} — ${
                      available
                        ? booking.steps.court.available
                        : booking.steps.court.busy
                    }`}
                    onClick={() => {
                      if (available) onSelect(court.id);
                    }}
                  >
                    <CourtSurface number={court.number} />
                    <span className={styles.courtMeta}>
                      <span className={styles.courtName}>{court.name}</span>
                      <span className={styles.courtStatus}>
                        {available
                          ? booking.steps.court.available
                          : booking.steps.court.busy}
                      </span>
                    </span>
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
