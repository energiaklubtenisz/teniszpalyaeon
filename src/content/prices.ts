export const prices = {
  title: "Áraink",
  lead: "2026. évi pályahasználati díjaink.",
  intro: {
    title: "Pályahasználat",
    paragraphs: [
      "Teniszpályáinkat klubtagsággal vagy megváltott bérlettel lehet használni.",
      "Klubtagság feltételeiről érdeklődjön a vezetőségnél.",
    ],
  },
  passes: {
    title: "Bérletárak",
    items: [
      {
        name: "Felnőtt szezonbérlet",
        price: "40.000 Ft",
        unit: "/ fő",
      },
      {
        name: "Családi szezonbérlet",
        price: "80.000 Ft",
        unit: "/ 4 fő",
        note: "Plusz főre kiegészítő bérlet: 20.000 Ft/fő",
      },
      {
        name: "Diák szezonbérlet (18 év alatti)",
        price: "20.000 Ft",
        unit: "/ fő",
      },
      {
        name: "Diák szezonbérlet (18 év feletti)",
        price: "30.000 Ft",
        unit: "/ fő",
      },
    ],
  },
  hourly: {
    title: "Egyedi pályahasználat",
    lead: "Előre egyeztetett időpontban.",
    name: "Pályabérleti díj",
    price: "5.000 Ft",
    unit: "/ óra",
  },
} as const;

export type PricesContent = typeof prices;
