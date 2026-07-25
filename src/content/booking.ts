import { HOURLY_RATE_HUF } from "@/lib/booking/constants";

export const booking = {
  title: "Foglalás",
  lead: "Válasszon pályát, napot és időpontot — legalább egy órára, félórás határokkal.",
  loginRequired: {
    title: "Bejelentkezés szükséges",
    body: "A foglaláshoz jelentkezzen be, vagy hozzon létre fiókot.",
    login: "Bejelentkezés",
    register: "Regisztráció",
  },
  steps: {
    court: {
      title: "Pályaválasztás",
      lead: "Nyolc salakpálya — 4 sor, soronként 2 pálya.",
    },
    day: {
      title: "Nap kiválasztása",
      lead: "Ma és a következő 30 nap közül választhat.",
      weekdays: ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
    },
    time: {
      title: "Idősáv",
      lead: "Nyitvatartás 8:00–20:00. Kattintson a kezdő, majd a záró időpontra (pl. 8:00 → 9:30). Minimum 1 óra.",
      hintStart: "Válassza ki a kezdés idejét.",
      hintEnd: "Válassza ki a befejezés idejét (legalább 1 órával később).",
      selected: "Kiválasztott sáv",
      booked: "Foglalt",
      past: "Elmúlt",
      available: "Szabad",
    },
    type: {
      title: "Bérlet vagy egyedi?",
      lead: "Jelölje meg, hogyan szeretne játszani. A bérletet egyelőre nem ellenőrizzük automatikusan.",
      seasonPass: {
        title: "Szezonbérletem van",
        body: "Bérletes pályahasználat — nincs óránkénti díj a foglaláskor.",
      },
      oneTime: {
        title: "Egyedi foglalás",
        body: `Pályabérleti díj: ${HOURLY_RATE_HUF.toLocaleString("hu-HU")} Ft / óra. Fizetés módja később egyeztetendő.`,
      },
    },
    confirm: {
      title: "Összegzés",
      lead: "Ellenőrizze a foglalást, majd erősítse meg.",
      court: "Pálya",
      date: "Nap",
      time: "Idő",
      type: "Típus",
      price: "Díj",
      priceFree: "Bérletes — 0 Ft",
      paymentNote: "Az egyedi díj fizetése később kerül kialakításra.",
      submit: "Foglalás megerősítése",
      submitting: "Foglalás…",
      success: "Sikeres foglalás!",
      successBody: "A kiválasztott pálya és időpont rögzítve.",
      another: "Új foglalás",
    },
  },
  nav: {
    back: "Vissza",
    next: "Tovább",
  },
  errors: {
    auth: "A foglaláshoz be kell jelentkeznie.",
    overlap: "Ez az idősáv már foglalt. Válasszon másik időt.",
    generic: "Nem sikerült a foglalás. Próbálja újra.",
    invalidRange: "Az idősáv legalább 1 óra legyen, :00 vagy :30 határokkal.",
  },
} as const;

export type BookingContent = typeof booking;
