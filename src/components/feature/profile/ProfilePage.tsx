import { ProfileForms } from "@/components/feature/profile/ProfileForms";
import { profile } from "@/content/profile";

import styles from "./profile.module.css";

type ProfilePageProps = {
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
};

export function ProfilePage({
  email,
  fullName,
  phone,
  avatarUrl = null,
}: ProfilePageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.section}>
        <div className={styles.headerArea}>
          <h1 className={styles.title}>{profile.title}</h1>
          <p className={styles.support}>{profile.support}</p>
        </div>
        <ProfileForms
          email={email}
          fullName={fullName}
          phone={phone}
          avatarUrl={avatarUrl}
        />
      </div>
    </main>
  );
}
