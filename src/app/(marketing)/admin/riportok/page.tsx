import type { Metadata } from "next";

import { getAdminDashboardMetrics } from "@/actions/admin";
import { AdminReportsView } from "@/components/feature/admin/reports/AdminReportsView";

export const metadata: Metadata = {
  title: "Riportok & Dashboard — Energia Szabadidősport Klub",
  description: "Pályakihasználtság, foglalási szokások és kimutatások.",
};

export default async function AdminReportsPage() {
  const result = await getAdminDashboardMetrics();

  if (!result.success) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6 py-12">
        <p className="text-center text-lg text-[var(--eon-red)]">
          {result.error}
        </p>
      </div>
    );
  }

  return <AdminReportsView metrics={result.data} />;
}
