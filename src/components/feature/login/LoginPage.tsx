import Image from "next/image";
import Link from "next/link";

import { LoginForm } from "@/components/feature/login/LoginForm";
import { login } from "@/content/login";
import { site } from "@/content/site";
import { assets } from "@/lib/assets";

import styles from "./login.module.css";

export function LoginPage() {
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
        <h1 className={styles.title}>{login.title}</h1>
        <p className={styles.support}>{login.support}</p>
        <LoginForm />
        <p className={styles.footer}>
          {login.registerPrompt}{" "}
          <Link href="/register" className={styles.footerLink}>
            {login.registerLink}
          </Link>
        </p>
        <p className={styles.brandFoot}>{site.name}</p>
      </section>
    </main>
  );
}
