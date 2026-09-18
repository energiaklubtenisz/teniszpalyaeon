import Image from "next/image";
import Link from "next/link";

import { RegisterForm } from "@/components/feature/register/RegisterForm";
import { register } from "@/content/register";
import { site } from "@/content/site";
import { assets } from "@/lib/assets";

import styles from "./register.module.css";

export function RegisterPage() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.brandMark}>
          <Image
            src={assets.brand.logo}
            alt=""
            width={112}
            height={72}
            className={styles.brandLogo}
          />
          <span className={styles.brandAccent} aria-hidden />
        </div>
        <h1 className={styles.title}>{register.title}</h1>
        <p className={styles.support}>{register.support}</p>
        <RegisterForm />
        <p className={styles.footer}>
          {register.loginPrompt}{" "}
          <Link href="/login" className={styles.footerLink}>
            {register.loginLink}
          </Link>
        </p>
        <p className={styles.brandFoot}>{site.name}</p>
      </section>
    </main>
  );
}
