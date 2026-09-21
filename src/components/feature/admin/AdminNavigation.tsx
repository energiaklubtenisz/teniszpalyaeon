"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, Ticket } from "lucide-react";

import { adminContent } from "@/content/admin";
import { cn } from "@/lib/utils";

import styles from "./admin.module.css";

export function AdminNavigation() {
  const pathname = usePathname();

  const isSeasonPass = pathname === "/admin";
  const isDatabase = pathname.startsWith("/admin/adatbazis");
  const isReports = pathname.startsWith("/admin/riportok");

  return (
    <nav className={styles.adminNav} aria-label="Admin navigáció">
      <Link
        href={adminContent.nav.seasonPasses.href}
        className={cn(
          styles.adminNavLink,
          isSeasonPass && styles.adminNavLinkActive,
        )}
      >
        <Ticket size={16} aria-hidden />
        <span>{adminContent.nav.seasonPasses.label}</span>
      </Link>

      <Link
        href={adminContent.nav.database.href}
        className={cn(
          styles.adminNavLink,
          isDatabase && styles.adminNavLinkActive,
        )}
      >
        <Database size={16} aria-hidden />
        <span>{adminContent.nav.database.label}</span>
      </Link>

      <Link
        href={adminContent.nav.reports.href}
        className={cn(
          styles.adminNavLink,
          isReports && styles.adminNavLinkActive,
        )}
      >
        <BarChart3 size={16} aria-hidden />
        <span>{adminContent.nav.reports.label}</span>
      </Link>
    </nav>
  );
}
