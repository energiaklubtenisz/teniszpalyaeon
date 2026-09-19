"use client";

import { useRouter } from "next/navigation";

import type { RegisteredUserCandidate, SeasonPassHolder } from "@/actions/admin";
import { adminContent } from "@/content/admin";

import { AddSeasonPassForm } from "./AddSeasonPassForm";
import { ActiveSeasonPassTable } from "./ActiveSeasonPassTable";
import styles from "./admin.module.css";

type AdminSeasonPassManagerProps = {
  holders: SeasonPassHolder[];
  candidates: RegisteredUserCandidate[];
};

export function AdminSeasonPassManager({
  holders,
  candidates,
}: AdminSeasonPassManagerProps) {
  const router = useRouter();

  const refreshData = () => {
    router.refresh();
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{adminContent.title}</h1>
          <p className={styles.support}>{adminContent.support}</p>
        </header>

        {/* Add Form */}
        <AddSeasonPassForm candidates={candidates} onAdded={refreshData} />

        {/* Active Season Pass Table */}
        <ActiveSeasonPassTable holders={holders} onRevoked={refreshData} />
      </div>
    </main>
  );
}
