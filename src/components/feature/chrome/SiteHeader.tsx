"use client";

import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Shield,
  User,
} from "lucide-react";
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
  isAdmin?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
};

export function SiteHeader({
  isAuthenticated,
  isAdmin = false,
  userName = null,
  userEmail = null,
  avatarUrl = null,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuId = useId();

  const displayName = userName?.trim() || site.nav.auth.profile.label;

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

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setProfileMenuOpen(false);
  }

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoLink} onClick={closeMenu}>
        <Image
          src={assets.brand.logo}
          alt={site.name}
          fill
          unoptimized
          className={styles.logoImage}
          sizes="120px"
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
                  styles.profileButton,
                  (profileMenuOpen ||
                    isActivePath(pathname, site.nav.auth.profile.href) ||
                    isActivePath(pathname, site.nav.auth.myBookings.href) ||
                    isActivePath(pathname, "/admin")) &&
                    styles.profileButtonActive
                )}
                aria-label={site.nav.auth.profile.menuLabel}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-controls={profileMenuId}
                onClick={() => {
                  setProfileMenuOpen((open) => !open);
                }}
              >
                <span className={styles.profileAvatar}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      unoptimized
                      className={styles.profileAvatarImg}
                    />
                  ) : (
                    <User className={styles.profileAvatarIcon} aria-hidden />
                  )}
                </span>
                <span className={styles.profileName}>{displayName}</span>
                <ChevronDown
                  className={cn(
                    styles.profileChevron,
                    profileMenuOpen && styles.profileChevronOpen
                  )}
                  aria-hidden
                />
              </button>

              {profileMenuOpen ? (
                <div
                  id={profileMenuId}
                  className={styles.profileDropdown}
                  role="menu"
                >
                  <div className={styles.profileDropdownHeader}>
                    <div className={styles.profileDropdownUserRow}>
                      <span className={styles.profileDropdownAvatar}>
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            fill
                            unoptimized
                            className={styles.profileAvatarImg}
                          />
                        ) : (
                          <User className={styles.profileAvatarIcon} aria-hidden />
                        )}
                      </span>
                      <div className={styles.profileDropdownUserInfo}>
                        <p className={styles.profileDropdownName}>{displayName}</p>
                        {userEmail ? (
                          <p className={styles.profileDropdownEmail}>{userEmail}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className={styles.profileDropdownDivider} />

                  {isAdmin ? (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className={cn(
                        styles.profileDropdownItem,
                        styles.profileDropdownAdmin,
                        isActivePath(pathname, "/admin") &&
                          styles.profileDropdownItemActive
                      )}
                      onClick={() => {
                        closeProfileMenu();
                        closeMenu();
                      }}
                    >
                      <span className={styles.dropdownItemMain}>
                        <Shield className={styles.dropdownItemIcon} aria-hidden />
                        <span>{site.nav.auth.admin.label}</span>
                      </span>
                      <span className={styles.adminBadge}>Admin</span>
                    </Link>
                  ) : null}

                  <Link
                    href={site.nav.auth.profile.href}
                    role="menuitem"
                    className={cn(
                      styles.profileDropdownItem,
                      isActivePath(pathname, site.nav.auth.profile.href) &&
                        styles.profileDropdownItemActive
                    )}
                    onClick={() => {
                      closeProfileMenu();
                      closeMenu();
                    }}
                  >
                    <span className={styles.dropdownItemMain}>
                      <User className={styles.dropdownItemIcon} aria-hidden />
                      <span>{site.nav.auth.profile.label}</span>
                    </span>
                  </Link>

                  <Link
                    href={site.nav.auth.myBookings.href}
                    role="menuitem"
                    className={cn(
                      styles.profileDropdownItem,
                      isActivePath(pathname, site.nav.auth.myBookings.href) &&
                        styles.profileDropdownItemActive
                    )}
                    onClick={() => {
                      closeProfileMenu();
                      closeMenu();
                    }}
                  >
                    <span className={styles.dropdownItemMain}>
                      <CalendarDays className={styles.dropdownItemIcon} aria-hidden />
                      <span>{site.nav.auth.myBookings.label}</span>
                    </span>
                  </Link>

                  <div className={styles.profileDropdownDivider} />

                  <form action={logout} className={styles.profileDropdownForm}>
                    <button
                      type="submit"
                      role="menuitem"
                      className={cn(
                        styles.profileDropdownItem,
                        styles.profileDropdownLogout
                      )}
                    >
                      <span className={styles.dropdownItemMain}>
                        <LogOut className={styles.dropdownItemIcon} aria-hidden />
                        <span>{site.nav.auth.logout.label}</span>
                      </span>
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
