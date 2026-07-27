import { contact } from "@/content/contact";
import { site } from "@/content/site";

export const PRIVACY_CONTACT_EMAIL = "adatvedelem@eon-tenisz.hu";

export const privacy = {
  title: "Adatvédelmi tájékoztató",
  lead: "Az Energia Szabadidősport Klub weboldalának adatkezelési gyakorlata.",
  lastUpdated: "2026. július 27.",
  sections: [
    {
      id: "bevezetes",
      title: "1. Bevezetés",
      paragraphs: [
        `Jelen adatvédelmi tájékoztató az ${site.name} (a továbbiakban: „Adatkezelő”) online felületén — a teniszpálya-foglalási weboldalon — történő személyes adatkezelésre vonatkozik.`,
        "A tájékoztató célja, hogy az érintettek (látogatók, regisztrált felhasználók) tájékozódhassanak arról, hogy milyen személyes adatokat kezelünk, milyen célból, milyen jogalapon, meddig, és milyen jogok illetik meg őket.",
        "Az adatkezelés az Európai Unió Általános Adatvédelmi Rendeletével (GDPR) és a vonatkozó magyar jogszabályokkal összhangban történik.",
      ],
    },
    {
      id: "adatkezelo",
      title: "2. Az adatkezelő adatai",
      paragraphs: [
        `Név: ${site.name}`,
        `Székhely: ${contact.address.lines[0]}`,
        `Adatvédelmi megkeresések: ${PRIVACY_CONTACT_EMAIL}`,
        "Az adatvédelmi kérdésekkel, kérelmekkel kapcsolatban a fenti e-mail címen érheti el az Adatkezelőt.",
      ],
    },
    {
      id: "adatok",
      title: "3. Kezelt személyes adatok köre",
      subsections: [
        {
          title: "3.1. Fiók és regisztráció",
          items: [
            "Teljes név",
            "E-mail cím",
            "Jelszó (titkosított, hash formában tárolva — olvasható formában nem kerül megőrzésre)",
            "Telefonszám (opcionális, a profil oldalon megadható)",
          ],
        },
        {
          title: "3.2. Pályafoglalás",
          items: [
            "Foglalás dátuma és időpontja (kezdés, befejezés)",
            "Foglalt pálya azonosítója",
            "Foglalás típusa (szezonbérletes vagy egyedi foglalás)",
            "Játékosok száma",
            "Társjátékosok nevei (a foglaló által megadott vendégjátékosok adatai)",
            "Egyedi foglalás esetén a kiszámított díj (Ft)",
            "A foglalás létrehozásának időpontja",
          ],
        },
        {
          title: "3.3. Kapcsolatfelvétel",
          items: [
            "Név",
            "E-mail cím",
            "Telefonszám (opcionális)",
            "Üzenet szövege",
          ],
          note: "A kapcsolatfelvételi űrlap adatai nem kerülnek adatbázisba; e-mailben továbbításra kerülnek az Adatkezelő részére.",
        },
        {
          title: "3.4. Technikai és munkamenet-adatok",
          items: [
            "Bejelentkezési munkamenet sütik (Supabase Auth)",
            "A weboldal használata során keletkező technikai naplóadatok (pl. IP-cím, böngésző típusa) az üzemeltető és az adatfeldolgozók rendszereiben",
          ],
        },
        {
          title: "3.5. Adminisztratív adatok",
          items: [
            "Felhasználói szerepkör (tag / adminisztrátor)",
            "Aktív szezonbérlet státusza",
          ],
          note: "Ezeket az adatokat nem Ön adja meg közvetlenül; az Adatkezelő kezeli a szolgáltatás biztosítása érdekében.",
        },
      ],
    },
    {
      id: "cel-jogalap",
      title: "4. Az adatkezelés célja és jogalapja",
      subsections: [
        {
          title: "4.1. Fiók létrehozása és kezelése",
          paragraphs: [
            "Cél: felhasználói fiók létrehozása, azonosítás, profiladatok kezelése.",
            "Jogalap: a szolgáltatás igénybevételéhez szükséges szerződés teljesítése, illetve a szerződéskötést megelőző lépések (GDPR 6. cikk (1) b) pont).",
          ],
        },
        {
          title: "4.2. Pályafoglalás",
          paragraphs: [
            "Cél: teniszpálya-időpont foglalása, foglaltság kezelése, saját foglalások megjelenítése.",
            "Jogalap: szerződés teljesítése / szerződéskötést megelőző lépések (GDPR 6. cikk (1) b) pont).",
          ],
        },
        {
          title: "4.3. Kapcsolatfelvétel",
          paragraphs: [
            "Cél: megkeresések, kérdések és ügyfélszolgálati megkeresések kezelése.",
            "Jogalap: az Adatkezelő jogos érdeke a megkeresések megválaszolására (GDPR 6. cikk (1) f) pont).",
          ],
        },
        {
          title: "4.4. Regisztráció során elfogadott tájékoztató",
          paragraphs: [
            "Cél: igazolható módon rögzíteni, hogy Ön megismerte és elfogadta jelen adatvédelmi tájékoztatót.",
            "Jogalap: hozzájárulás (GDPR 6. cikk (1) a) pont).",
          ],
        },
        {
          title: "4.5. Munkamenet-sütik",
          paragraphs: [
            "Cél: bejelentkezett állapot fenntartása, biztonságos hozzáférés biztosítása.",
            "Jogalap: szerződés teljesítése; az elengedhetetlen sütik használata a szolgáltatás működéséhez szükséges (GDPR 6. cikk (1) b) pont).",
          ],
        },
      ],
    },
    {
      id: "megorzes",
      title: "5. Adatmegőrzés",
      paragraphs: [
        "A fiókhoz kapcsolódó adatokat a fiók fennállása alatt kezeljük. A felhasználó a profil oldalon kezdeményezheti fiókja törlését; ekkor a fiókhoz tartozó profil- és foglalási adatok is törlésre kerülnek.",
        "A foglalási adatok a fiók törléséig megmaradnak. A múltbeli foglalások a „Foglalásaim” oldalon is megjeleníthetők a fiók fennállása alatt.",
        "A kapcsolatfelvételi üzeneteket e-mailben továbbítjuk; az e-mailek megőrzési idejét az Adatkezelő levelezőrendszere és az e-mail szolgáltató (Resend) szabályzata határozza meg.",
        "A munkamenet-sütik érvényességi idejét az üzemeltető rendszere kezeli; a bejelentkezési tokenek a biztonságos működés érdekében időkorlátozottak.",
        "Az Adatkezelő nem alkalmaz automatikus adattörlési időzítőt inaktív fiókokra; ilyen esetben a fenti megőrzési szabályok érvényesek, amíg a fiókot Ön vagy az Adatkezelő nem törli.",
      ],
    },
    {
      id: "feldolgozok",
      title: "6. Adatfeldolgozók és adattovábbítás",
      paragraphs: [
        "Az Adatkezelő az alábbi adatfeldolgozókat veszi igénybe a szolgáltatás működtetéséhez:",
      ],
      processors: [
        {
          name: "Supabase",
          purpose:
            "Felhasználói hitelesítés, adatbázis- és alkalmazás-üzemeltetés (profil- és foglalási adatok tárolása).",
        },
        {
          name: "Resend",
          purpose:
            "Kapcsolatfelvételi üzenetek e-mailben történő továbbítása az Adatkezelő részére.",
        },
        {
          name: "Google",
          purpose:
            "Betűtípusok (Google Fonts) és a Kapcsolat oldalon megjelenő beágyazott térkép (Google Maps) biztosítása.",
        },
      ],
      closing:
        "Az adatfeldolgozók adatvédelmi szabályzata és az adatkezelés helye (beleértve az EU-n kívüli adattovábbítást, ha az felmerül) az adott szolgáltató feltételei szerint értelmezendő. Az Adatkezelő törekszik arra, hogy megfelelő szerződéses és technikai garanciákat alkalmazzon.",
    },
    {
      id: "harmadik-szemely",
      title: "7. Harmadik személyek adatai",
      paragraphs: [
        "Pályafoglalás során megadhat társjátékosok nevét. Ezek harmadik személyek személyes adatai; Ön vállalja, hogy jogosult ezen adatok megadására (például a társjátékos hozzájárulásával vagy tájékoztatásával).",
        "Az Adatkezelő e neveket kizárólag a foglalás teljesítése és azonosítása érdekében kezeli.",
      ],
    },
    {
      id: "lathatosag",
      title: "8. Foglalási adatok láthatósága",
      paragraphs: [
        "A megerősített foglalások időbeli és pálya szerinti foglaltsága a foglalási rendszer működéséhez szükséges (pálya-elérhetőség ellenőrzése). A nyilvános felületen ez a foglaltsági információ jelenik meg; a vendégjátékosok nevei és a személyes foglalási részletek nem jelennek meg nyilvánosan.",
        "A saját foglalásait bejelentkezés után a „Foglalásaim” oldalon tekintheti meg.",
      ],
    },
    {
      id: "sutik",
      title: "9. Sütik (cookie-k)",
      paragraphs: [
        "A weboldal elengedhetetlen, munkamenet-kezelő sütiket használ a bejelentkezés fenntartásához (Supabase Auth). Ezek nélkül a fiókkal összekapcsolt funkciók (pl. foglalás, profil) nem működnek megfelelően.",
        "Marketing- vagy analitikai célú sütiket jelenleg nem alkalmazunk.",
        "A Google Fonts és a Google Maps beágyazás a böngészőn keresztül harmadik félhez (Google) küldhet technikai adatokat (pl. IP-cím).",
      ],
    },
    {
      id: "jogok",
      title: "10. Az érintett jogai",
      paragraphs: [
        "Önt a GDPR alapján az alábbi jogok illetik meg:",
      ],
      items: [
        "Hozzáféréshez való jog — tájékoztatást kérhet arról, hogy kezeljük-e személyes adatait.",
        "Helyesbítéshez való jog — kérheti a pontatlan adatok javítását (pl. profil oldalon, vagy e-mailben).",
        "Törléshez való jog („elfeledtetéshez való jog”) — kérheti adatai törlését; fiókját a profil oldalon is törölheti.",
        "Az adatkezelés korlátozásához való jog — bizonyos esetekben kérheti az adatkezelés felfüggesztését.",
        "Adathordozhatósághoz való jog — strukturált, géppel olvasható formában kérheti az Önre vonatkozó adatokat, ahol ez technikailag megvalósítható.",
        "Tiltakozáshoz való jog — jogos érdeken alapuló adatkezelés esetén tiltakozhat.",
        "A hozzájárulás visszavonásához való jog — ha adatkezelés hozzájáruláson alapul, a visszavonás nem érinti a visszavonás előtti adatkezelés jogszerűségét.",
      ],
      closing: `Jogai gyakorlásához írjon a ${PRIVACY_CONTACT_EMAIL} címre. Kérését indokolatlan késedelem nélkül, de legfeljebb egy hónapon belül teljesítjük.`,
    },
    {
      id: "panasz",
      title: "11. Panasz és jogorvoslat",
      paragraphs: [
        "Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH) fordulhat, ha úgy véli, hogy személyes adatainak kezelése sérti a jogszabályokat.",
        "NAIH elérhetősége: 1055 Budapest, Falk Miksa utca 9–11.; postacím: 1363 Budapest, Pf. 9.; telefon: +36 1 391 1400; e-mail: ugyfelszolgalat@naih.hu; web: https://www.naih.hu",
      ],
    },
    {
      id: "modositasok",
      title: "12. A tájékoztató módosítása",
      paragraphs: [
        "Az Adatkezelő fenntartja a jogot jelen tájékoztató frissítésére (például új funkciók, adatfeldolgozók vagy jogszabályi változások miatt). A módosított verzió ezen az oldalon kerül közzétételre; a „Hatálybalépés” dátuma jelzi az utolsó frissítést.",
        "Lényeges változás esetén — ahol ez indokolt — a weboldalon is tájékoztatjuk a felhasználókat.",
      ],
    },
    {
      id: "hataly",
      title: "13. Hatálybalépés",
      paragraphs: [
        "Jelen adatvédelmi tájékoztató hatálybalépésének napja az oldal tetején feltüntetett dátum.",
      ],
    },
  ],
} as const;

export type PrivacyContent = typeof privacy;
