"use client";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  GraduationCap,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { logout } from "@/actions/auth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notification";
import { site } from "@/content/site";
import { assets } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/coach";

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
  isCoach?: boolean;
  isCoachedPlayer?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  unreadNotificationCount?: number;
};

export function SiteHeader({
  isAuthenticated,
  isAdmin = false,
  isCoach = false,
  isCoachedPlayer = false,
  userName = null,
  userEmail = null,
  avatarUrl = null,
  unreadNotificationCount = 0,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadNotificationCount);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuId = useId();
  const notificationMenuId = useId();
  const [, startTransition] = useTransition();

  const displayName = userName?.trim() || site.nav.auth.profile.label;

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  const closeNotificationMenu = () => {
    setNotificationMenuOpen(false);
  };

  // Sync server-provided count with local state
  useEffect(() => {
    setLocalUnreadCount(unreadNotificationCount);
  }, [unreadNotificationCount]);

  // Close menus on outside click
  useEffect(() => {
    if (!profileMenuOpen && !notificationMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node) {
        if (
          profileMenuOpen &&
          !profileMenuRef.current?.contains(target)
        ) {
          setProfileMenuOpen(false);
        }
        if (
          notificationMenuOpen &&
          !notificationMenuRef.current?.contains(target)
        ) {
          setNotificationMenuOpen(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setNotificationMenuOpen(false);
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
  }, [profileMenuOpen, notificationMenuOpen]);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setProfileMenuOpen(false);
    setNotificationMenuOpen(false);
  }

  const handleOpenNotifications = () => {
    const willOpen = !notificationMenuOpen;
    setNotificationMenuOpen(willOpen);
    setProfileMenuOpen(false);

    if (willOpen && !loadingNotifications) {
      setLoadingNotifications(true);
      startTransition(async () => {
        const result = await getNotifications();
        if (result.success) {
          setNotifications(result.data);
        }
        setLoadingNotifications(false);
      });
    }
  };

  const handleMarkRead = (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationRead(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        setLocalUnreadCount((c) => Math.max(0, c - 1));
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setLocalUnreadCount(0);
      }
    });
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) {
      handleMarkRead(n.id);
    }
    setNotificationMenuOpen(false);
    if (n.type === "coach_invitation" || n.type === "practice_cancelled" || n.type === "coach_assignment") {
      router.push("/edzeseim");
    } else if (n.type === "booking_displaced") {
      router.push("/foglalasaim");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "most";
    if (minutes < 60) return `${minutes} perce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} órája`;
    const days = Math.floor(hours / 24);
    return `${days} napja`;
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
            <div className={styles.authActions}>
              {/* Notification Bell */}
              <div className={styles.notificationArea} ref={notificationMenuRef}>
                <button
                  type="button"
                  className={styles.notificationButton}
                  aria-label="Értesítések"
                  aria-expanded={notificationMenuOpen}
                  aria-controls={notificationMenuId}
                  onClick={handleOpenNotifications}
                >
                  <Bell className={styles.notificationIcon} aria-hidden />
                  {localUnreadCount > 0 ? (
                    <span className={styles.notificationBadge}>
                      {localUnreadCount > 9 ? "9+" : localUnreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationMenuOpen ? (
                  <div
                    id={notificationMenuId}
                    className={styles.notificationDropdown}
                    role="menu"
                  >
                    <div className={styles.notificationDropdownHeader}>
                      <span className={styles.notificationDropdownTitle}>
                        Értesítések
                      </span>
                      {localUnreadCount > 0 ? (
                        <button
                          type="button"
                          className={styles.notificationMarkAll}
                          onClick={handleMarkAllRead}
                        >
                          Mind olvasott
                        </button>
                      ) : null}
                    </div>
                    <div className={styles.profileDropdownDivider} />
                    <div className={styles.notificationList}>
                      {loadingNotifications ? (
                        <p className={styles.notificationEmpty}>
                          Betöltés...
                        </p>
                      ) : notifications.length === 0 ? (
                        <p className={styles.notificationEmpty}>
                          Nincs értesítés
                        </p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            className={cn(
                              styles.notificationItem,
                              !n.read && styles.notificationItemUnread,
                            )}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <span className={styles.notificationItemTitle}>
                              {n.title}
                            </span>
                            <span className={styles.notificationItemBody}>
                              {n.body}
                            </span>
                            <span className={styles.notificationItemTime}>
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Profile Menu */}
              <div className={styles.profileMenu} ref={profileMenuRef}>
                <button
                  type="button"
                  className={cn(
                    styles.profileButton,
                    (profileMenuOpen ||
                      isActivePath(pathname, site.nav.auth.profile.href) ||
                      isActivePath(pathname, site.nav.auth.myBookings.href) ||
                      isActivePath(pathname, "/admin") ||
                      isActivePath(pathname, "/coach") ||
                      isActivePath(pathname, "/edzeseim")) &&
                      styles.profileButtonActive
                  )}
                  aria-label={site.nav.auth.profile.menuLabel}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-controls={profileMenuId}
                  onClick={() => {
                    setProfileMenuOpen((open) => !open);
                    setNotificationMenuOpen(false);
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

                    {isCoach ? (
                      <Link
                        href={site.nav.auth.coach.href}
                        role="menuitem"
                        className={cn(
                          styles.profileDropdownItem,
                          styles.profileDropdownCoach,
                          isActivePath(pathname, site.nav.auth.coach.href) &&
                            styles.profileDropdownItemActive
                        )}
                        onClick={() => {
                          closeProfileMenu();
                          closeMenu();
                        }}
                      >
                        <span className={styles.dropdownItemMain}>
                          <GraduationCap className={styles.dropdownItemIcon} aria-hidden />
                          <span>{site.nav.auth.coach.label}</span>
                        </span>
                        <span className={styles.coachBadge}>Edző</span>
                      </Link>
                    ) : null}

                    {isCoachedPlayer ? (
                      <Link
                        href={site.nav.auth.myPractices.href}
                        role="menuitem"
                        className={cn(
                          styles.profileDropdownItem,
                          isActivePath(pathname, site.nav.auth.myPractices.href) &&
                            styles.profileDropdownItemActive
                        )}
                        onClick={() => {
                          closeProfileMenu();
                          closeMenu();
                        }}
                      >
                        <span className={styles.dropdownItemMain}>
                          <Dumbbell className={styles.dropdownItemIcon} aria-hidden />
                          <span>{site.nav.auth.myPractices.label}</span>
                        </span>
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
