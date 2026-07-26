"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { login } from "@/content/login";
import { cn } from "@/lib/utils";

import styles from "./auth-toast.module.css";

const NOTICE_MESSAGES = {
  login: login.notices.login,
  logout: login.notices.logout,
} as const;

const TOAST_MS = 2000;

type NoticeKey = keyof typeof NOTICE_MESSAGES;

function isNoticeKey(value: string | null): value is NoticeKey {
  return value === "login" || value === "logout";
}

export function AuthToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const notice = searchParams.get("notice");

  const [toast, setToast] = useState<{ id: number; text: string } | null>(
    null,
  );
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!isNoticeKey(notice)) {
      return;
    }

    setLeaving(false);
    setToast({ id: Date.now(), text: NOTICE_MESSAGES[notice] });
    router.replace(pathname, { scroll: false });
  }, [notice, pathname, router]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    setLeaving(false);

    const leaveTimer = window.setTimeout(() => {
      setLeaving(true);
    }, TOAST_MS - 200);

    const clearTimer = window.setTimeout(() => {
      setToast(null);
      setLeaving(false);
    }, TOAST_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(clearTimer);
    };
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div
      key={toast.id}
      className={cn(styles.toast, leaving && styles.toastLeaving)}
      role="status"
      aria-live="polite"
    >
      {toast.text}
    </div>
  );
}
