import { ProfileForms } from "@/components/feature/profile/ProfileForms";
import { profile } from "@/content/profile";

import styles from "./profile.module.css";

type ProfilePageProps = {
  email: string;
  fullName: string;
  phone: string;
};

export function ProfilePage({ email, fullName, phone }: ProfilePageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.section}>
        <h1 className={styles.title}>{profile.title}</h1>
        <p className={styles.support}>{profile.support}</p>
        <ProfileForms email={email} fullName={fullName} phone={phone} />
      </div>
    </main>
  );
}
