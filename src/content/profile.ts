export const profile = {
  title: "Profil",
  support: "Kezelje a fiókját és a kapcsolattartási adatait.",
  emailLabel: "E-mail",
  sections: {
    details: {
      title: "Profil adatok",
      support: "Frissítheti a nevét és a telefonszámát.",
      submit: "Mentés",
      submitting: "Mentés…",
    },
    password: {
      title: "Jelszó módosítása",
      support: "Adja meg a jelenlegi jelszavát, majd az újat.",
      submit: "Jelszó mentése",
      submitting: "Mentés…",
    },
    delete: {
      title: "Fiók törlése",
      support:
        "A törlés végleges: a fiók és a kapcsolódó adatok eltávolításra kerülnek.",
      confirmLabel: "Megértettem, véglegesen törlöm a fiókomat.",
      submit: "Fiók törlése",
      submitting: "Törlés…",
    },
  },
  fields: {
    fullName: { label: "Teljes név" },
    phone: { label: "Telefonszám", placeholder: "pl. 06-30-123-4567" },
    currentPassword: { label: "Jelenlegi jelszó" },
    password: { label: "Új jelszó" },
    passwordConfirm: { label: "Új jelszó megerősítése" },
    deletePassword: { label: "Jelszó a törléshez" },
  },
  notices: {
    accountDeleted: "A fiók törölve lett.",
  },
} as const;

export type ProfileContent = typeof profile;
