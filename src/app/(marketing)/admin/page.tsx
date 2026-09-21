import type { Metadata } from "next";

import { getSeasonPassData } from "@/actions/admin";
import { AdminSeasonPassManager } from "@/components/feature/admin/AdminSeasonPassManager";

export const metadata: Metadata = {
  title: "Adminisztráció — Energia Szabadidősport Klub",
  description: "Aktív bérletesek és klubtagok kezelése.",
};

export default async function AdminPage() {
  const result = await getSeasonPassData();

  if (!result.success) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6 py-12">
        <p className="text-center text-lg text-[var(--eon-red)]">
          {result.error}
        </p>
      </div>
    );
  }

  const { holders, candidates } = result.data;

  return (
    <AdminSeasonPassManager holders={holders} candidates={candidates} />
  );
}
