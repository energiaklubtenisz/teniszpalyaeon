import { AdminNavigation } from "@/components/feature/admin/AdminNavigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import styles from "@/components/feature/admin/admin.module.css";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AdminNavigation />
        {children}
      </div>
    </main>
  );
}

