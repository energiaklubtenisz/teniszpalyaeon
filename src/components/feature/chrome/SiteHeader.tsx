"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logout } from "@/actions/auth";
import { site } from "@/content/site";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";

import styles from "./site-header.module.css";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SiteHeaderProps = {
  isAuthenticated: boolean;
};

export function SiteHeader({ isAuthenticated }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink} onClick={closeMenu}>
        <Image
          src={assets.brand.logo}
          alt={site.name}
          fill
          unoptimized
          className={styles.logoImage}
          sizes="px"
          priority
        />
      </Link>

      <button
        type="button"
        className={styles.menuToggle}
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        aria-label={menuOpen ? "Menü bezárása" : "Menü megnyitása"}
        onClick={() => {
          setMenuOpen((open) => !open);
        }}
      >
        <span className={styles.menuIcon} aria-hidden />
      </button>

      <nav
        id="site-nav"
        className={cn(styles.nav, menuOpen && styles.navOpen)}
      >
        <div className={styles.primary}>
          {site.nav.primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                styles.link,
                isActivePath(pathname, item.href) && styles.linkActive
              )}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className={styles.auth}>
          {isAuthenticated ? (
            <form action={logout}>
              <button
                type="submit"
                className={styles.logout}
                onClick={closeMenu}
              >
                {site.nav.auth.logout.label}
              </button>
            </form>
          ) : (
            <>
              <Link
                href={site.nav.auth.login.href}
                className={cn(
                  styles.login,
                  isActivePath(pathname, site.nav.auth.login.href) &&
                    styles.loginActive
                )}
                onClick={closeMenu}
              >
                {site.nav.auth.login.label}
              </Link>
              <Link
                href={site.nav.auth.register.href}
                className={cn(
                  styles.register,
                  isActivePath(pathname, site.nav.auth.register.href) &&
                    styles.registerActive
                )}
                onClick={closeMenu}
              >
                {site.nav.auth.register.label}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
