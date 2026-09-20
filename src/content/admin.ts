export const adminContent = {
  title: "Adminisztrációs felület",
  support:
    "Bérletesek és klubtagok kezelése.",
  seasonPass: {
    sectionTitle: "Aktív bérletesek",
    searchPlaceholder: "Keresés név vagy email cím alapján...",
    table: {
      columns: {
        name: "Név",
        email: "Email cím",
        phone: "Telefonszám",
        status: "Státusz",
        addedAt: "Hozzáadva",
        actions: "Művelet",
      },
      status: {
        active: "Aktív",
        pending: "Regisztrációra vár",
      },
      empty: {
        title: "Nincsenek aktív bérletesek",
        body: "Még egyetlen felhasználóhoz sincs aktív szezonbérlet hozzárendelve. Az űrlapon adhat hozzá új email címet.",
        noResults: "Nincs a keresési feltételnek megfelelő bérletes.",
      },
      actions: {
        revoke: "Visszavonás",
        revoking: "Visszavonás...",
        confirmRevoke: "Biztosan vissza szeretné vonni a bérletet erről a címről?",
      },
    },
    addForm: {
      title: "Új bérletes hozzáadása",
      support:
        "Adja meg a felhasználó email címét. Ha a tag már regisztrált, azonnal aktívvá válik a bérlete. Ha még nem regisztrált, a regisztrációjakor automatikusan megkapja az aktív bérletet.",
      emailLabel: "Felhasználó email címe",
      emailPlaceholder: "pelda@gmail.com",
      submitButton: "Bérlet aktiválása",
      submittingButton: "Hozzáadás...",
      registeredSuggestionsLabel: "Gyors választás regisztrált tagok közül (bérlet nélküliek):",
      errors: {
        invalidEmail: "Kérjük, érvényes email címet adjon meg.",
        alreadyExists: "Ez az email cím már szerepel az aktív bérletesek listáján.",
        generic: "A bérlet hozzáadása nem sikerült. Próbálja újra később.",
        unauthorized: "Ehhez a művelethez adminisztrátori jogosultság szükséges.",
      },
      success: {
        registered: "A bérlet sikeresen aktiválva {email} számára!",
        pending: "{email} rögzítve az aktív bérletesek közé. Regisztrációkor automatikusan aktiválódik.",
      },
    },
    revokeSuccess: "A bérlet sikeresen visszavonva ({email}).",
    revokeError: "A bérlet visszavonása nem sikerült.",
  },
} as const;
