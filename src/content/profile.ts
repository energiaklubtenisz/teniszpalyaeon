export const profile = {
  title: "Profil",
  support: "Kezelje személyes adatait, profilképét és biztonsági beállításait.",
  emailLabel: "E-mail cím",
  emailBadge: "Aktivált fiókazonosító",
  tabs: {
    details: "Személyes adatok",
    security: "Biztonság & Fiók",
  },
  avatar: {
    title: "Profilkép",
    support: "Töltsön fel egy képet magáról (JPG, PNG, WEBP, max 2 MB).",
    uploadButton: "Fotó feltöltése",
    uploadingButton: "Feltöltés…",
    removeButton: "Fotó eltávolítása",
    removingButton: "Eltávolítás…",
    badgeLabel: "Profilkép",
  },
  sections: {
    details: {
      title: "Személyes információk",
      support: "Itt frissítheti a rendszerben megjelenő nevét és elérhetőségét.",
      submit: "Módosítások mentése",
      submitting: "Mentés folyamatban…",
    },
    password: {
      title: "Jelszó módosítása",
      support: "Változtassa meg jelszavát fiókja biztonságának megőrzése érdekében.",
      submit: "Jelszó frissítése",
      submitting: "Frissítés…",
    },
    delete: {
      badge: "Veszélyzóna",
      title: "Fiók végleges törlése",
      support:
        "A fiók törlése azonnali és visszafordíthatatlan művelet. Minden aktív bérlete és foglalási előzménye véglegesen törlésre kerül.",
      confirmLabel: "Megértettem a következményeket, véglegesen törlöm a fiókomat.",
      submit: "Fiók törlése",
      submitting: "Törlés folyamatban…",
    },
  },
  fields: {
    fullName: { label: "Teljes név" },
    phone: { label: "Telefonszám", placeholder: "+36 (30) 123-4567" },
    currentPassword: { label: "Jelenlegi jelszó" },
    password: { label: "Új jelszó" },
    passwordConfirm: { label: "Új jelszó megerősítése" },
    deletePassword: { label: "Jelszó a törlés megerősítéséhez" },
  },
  notices: {
    accountDeleted: "A fiók törölve lett.",
  },
} as const;

export type ProfileContent = typeof profile;
