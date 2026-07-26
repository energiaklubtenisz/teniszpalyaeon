"use client";

import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuId = useId();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !profileMenuRef.current?.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

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
            <div className={styles.profileMenu} ref={profileMenuRef}>
              <button
                type="button"
                className={cn(
                  styles.profile,
                  (profileMenuOpen ||
                    isActivePath(pathname, site.nav.auth.profile.href)) &&
                    styles.profileActive
                )}
                aria-label={site.nav.auth.profile.menuLabel}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-controls={profileMenuId}
                onClick={() => {
                  setProfileMenuOpen((open) => !open);
                }}
              >
                <User className={styles.profileIcon} aria-hidden />
              </button>

              {profileMenuOpen ? (
                <div
                  id={profileMenuId}
                  className={styles.profileDropdown}
                  role="menu"
                >
                  <Link
                    href={site.nav.auth.profile.href}
                    role="menuitem"
                    className={styles.profileDropdownItem}
                    onClick={() => {
                      closeProfileMenu();
                      closeMenu();
                    }}
                  >
                    {site.nav.auth.profile.label}
                  </Link>
                  <form action={logout} className={styles.profileDropdownForm}>
                    <button
                      type="submit"
                      role="menuitem"
                      className={styles.profileDropdownItem}
                    >
                      {site.nav.auth.logout.label}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
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
