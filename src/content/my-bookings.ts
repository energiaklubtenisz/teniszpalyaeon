export const myBookings = {
  title: "Foglalásaim",
  support: "Tekintse meg megerősített pályafoglalásait.",
  sections: {
    upcoming: "Következő foglalások",
    past: "Korábbi foglalások",
  },
  empty: {
    title: "Még nincs foglalása",
    body: "Foglaljon pályát, és a sikeres foglalások itt jelennek meg.",
    cta: "Új foglalás",
    href: "/booking",
  },
  card: {
    expand: "Részletek megtekintése",
    collapse: "Részletek elrejtése",
    courtLabel: "{n}. pálya",
    typeBadge: {
      seasonPass: "Bérletes",
      oneTime: "Egyedi",
    },
    labels: {
      court: "Pálya",
      date: "Nap",
      time: "Idő",
      type: "Típus",
      players: "Játékosok",
      playerNames: "Nevek",
      price: "Díj",
    },
    type: {
      seasonPass: "Szezonbérletem van",
      oneTime: "Egyedi foglalás",
    },
    playersCount: "{n} fő",
    bookerFallback: "Profil név nincs megadva",
    priceFree: "Bérletes — 0 Ft",
  },
  loadError: "Nem sikerült betölteni a foglalásokat.",
} as const;

export type MyBookingsContent = typeof myBookings;
