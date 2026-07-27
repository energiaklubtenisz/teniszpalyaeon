export const contact = {
  title: "Kapcsolat",
  lead: "Cím, parkolás, elérhetőségek",
  address: {
    title: "Cím és parkolás",
    label: "Pályánk címe",
    lines: ["8800 Nagykanizsa, Vár utca 2."],
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
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3289.2131966136094!2d16.981236499999998!3d46.453338099999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47689328e4c82b05%3A0x2b8332e703c9d74c!2sEnergia%20Szabadid%C5%91sport%20Klub!5e1!3m2!1shu!2shu!4v1785085844573!5m2!1shu!2shu",
    iframeTitle: "Teniszpálya helyszíne a térképen — Nagykanizsa, Király utca 2.",
  },
} as const;

export type ContactContent = typeof contact;
