"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, GraduationCap, Loader2, Shield, User } from "lucide-react";
import type { Database } from "@/types/database.types";
import styles from "../admin.module.css";

type UserRole = Database["public"]["Enums"]["user_role"];

type RoleDropdownProps = {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
  onRoleChange: (userId: string, newRole: UserRole) => void;
};

const ROLES: Array<{
  id: UserRole;
  label: string;
  description: string;
  icon: typeof User;
  badgeClass: string;
  iconColor: string;
}> = [
  {
    id: "member",
    label: "Tag",
    description: "Normál játékos és pályafoglaló",
    icon: User,
    badgeClass: styles.roleIconBadgeMember,
    iconColor: "var(--graphite)",
  },
  {
    id: "coach",
    label: "Edző",
    description: "Intervallum foglalások, játékosok kezelése",
    icon: GraduationCap,
    badgeClass: styles.roleIconBadgeCoach,
    iconColor: "#1d4ed8",
  },
  {
    id: "admin",
    label: "Adminisztrátor",
    description: "Teljes hozzáférés és rendszervezérlés",
    icon: Shield,
    badgeClass: styles.roleIconBadgeAdmin,
    iconColor: "var(--eon-red)",
  },
];

export function RoleDropdown({
  userId,
  currentRole,
  disabled,
  onRoleChange,
}: RoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = ROLES.find((r) => r.id === currentRole) ?? ROLES[0];
  const ActiveIcon = activeConfig.icon;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleSelect = (role: UserRole) => {
    setIsOpen(false);
    if (role !== currentRole) {
      onRoleChange(userId, role);
    }
  };

  return (
    <div className={styles.roleDropdownWrapper} ref={dropdownRef}>
      <button
        type="button"
        className={styles.roleDropdownTrigger}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Szerepkör módosítása"
      >
        {disabled ? (
          <Loader2 size={13} className="animate-spin text-[var(--smoke)]" aria-hidden />
        ) : (
          <ActiveIcon size={13} style={{ color: activeConfig.iconColor }} aria-hidden />
        )}
        <span>{activeConfig.label}</span>
        <ChevronDown
          size={12}
          style={{
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
            color: "var(--ash)",
          }}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className={styles.roleDropdownMenu} role="listbox" aria-label="Szerepkörök">
          <div className={styles.roleDropdownHeader}>Szerepkör váltása</div>
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = role.id === currentRole;

            return (
              <button
                key={role.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`${styles.roleDropdownItem} ${
                  isSelected ? styles.roleDropdownItemActive : ""
                }`}
                onClick={() => handleSelect(role.id)}
              >
                <div className={`${styles.roleIconBadge} ${role.badgeClass}`}>
                  <Icon size={14} aria-hidden />
                </div>
                <div className={styles.roleItemContent}>
                  <span className={styles.roleItemLabel}>{role.label}</span>
                  <span className={styles.roleItemDesc}>{role.description}</span>
                </div>
                {isSelected && (
                  <Check size={14} style={{ color: "var(--ink)", marginLeft: "0.25rem" }} aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
