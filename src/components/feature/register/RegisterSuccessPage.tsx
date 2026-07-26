import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { register } from "@/content/register";
import { cn } from "@/lib/utils";

import styles from "./register.module.css";

export function RegisterSuccessPage() {
  const { success } = register;

  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <h1 className={styles.title}>{success.title}</h1>
        <p className={styles.support}>{success.support}</p>
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg" }), styles.successCta)}
        >
          {success.loginCta}
        </Link>
      </section>
    </main>
  );
}
