export const contact = {
  title: "Kapcsolat",
  lead: "Cím, parkolás, elérhetőségek — vagy írjon nekünk üzenetet.",
  address: {
    title: "Cím és parkolás",
    label: "Pályánk címe",
    lines: ["8800 Nagykanizsa, Király utca 2."],
    directions:
      "A belváros irányából a Vár utcai vasúti kereszteződés előtt, az E.ON telephellyel szemben.",
    parking: {
      title: "Parkolás",
      body: "A klub kerítése és a kerékpárút közötti kavicsos parkoló, illetve az E.ON irodaház külső parkolója is igénybe vehető.",
    },
  },
  people: {
    title: "Elérhetőségek",
    contacts: [
      {
        role: "Klubelnök",
        name: "Csinger Gábor",
        phones: [{ label: "06-30-4748-185", href: "tel:+36304748185" }],
        emails: [
          {
            label: "gabor.csinger@eon-hungaria.com",
            href: "mailto:gabor.csinger@eon-hungaria.com",
          },
          {
            label: "gabor.csinger@gmail.com",
            href: "mailto:gabor.csinger@gmail.com",
          },
        ],
      },
      {
        role: "Pályagondnok",
        name: "Márton József",
        phones: [{ label: "06-30-3789-328", href: "tel:+36303789328" }],
        emails: [],
      },
    ],
    lines: [
      {
        role: "Klubtelefon",
        detail: "93/788-913",
        note: "UPC vonal",
        href: "tel:+3693788913",
      },
      {
        role: "E.ON teherporta",
        detail: "06-20-746-8836",
        note: "0–24 órás portaszolgálat",
        href: "tel:+36207468836",
      },
    ],
  },
  access: {
    title: "Bejutás és kulcsok",
    gate: {
      title: "Portaszolgálat",
      paragraphs: [
        "Klub ügyeletesek a portaszolgálatnál vehetik fel a teniszpálya kulcsát. Zárás után a kulcsot le kell adni a portán.",
      ],
    },
    seasonPass: {
      title: "Bérletesek bejutása",
      paragraphs: [
        "Éves teniszbérlettel rendelkezők egyedi belépő kódot kapnak a személykapun történő bejutáshoz.",
        "A teniszszezon ideje alatt hétfőtől vasárnapig (épülethasználat kivételével).",
      ],
    },
  },
  form: {
    title: "Írjon nekünk",
    lead: "Küldjön üzenetet a klubnak — válaszolunk, amint tudunk.",
    optional: "opcionális",
    submit: "Üzenet küldése",
    submitting: "Küldés…",
    fields: {
      name: { label: "Név" },
      email: { label: "E-mail" },
      phone: { label: "Telefon" },
      message: { label: "Üzenet" },
    },
  },
  map: {
    title: "Térkép",
    openLabel: "Megnyitás a Google Térképen",
    href: "https://maps.app.goo.gl/jSHF7y5pYhbG2s697",
    embedSrc:
      "https://maps.google.com/maps?q=8800+Nagykanizsa,+Kir%C3%A1ly+utca+2&hl=hu&z=16&output=embed",
    iframeTitle: "Teniszpálya helyszíne a térképen — Nagykanizsa, Király utca 2.",
  },
} as const;

export type ContactContent = typeof contact;
