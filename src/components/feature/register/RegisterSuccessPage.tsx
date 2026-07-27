import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { register } from "@/content/register";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

import styles from "./register.module.css";

export function RegisterSuccessPage() {
  const { success } = register;

  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.brandMark}>
          <Image
            src={assets.brand.logo}
            alt=""
            width={72}
            height={48}
            className={styles.brandLogo}
          />
          <span className={styles.brandAccent} aria-hidden />
        </div>
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
