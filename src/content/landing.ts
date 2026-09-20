export const landing = {
  hero: {
    brand: "Energia Szabadidősport Klub",
    headline: "Nagykanizsa legnagyobb szabadtéri teniszklubja",
    support:
      "8 salakpálya. Ahol a sport és a közösség találkozik.",
    primaryCta: { label: "Foglalás", href: "/booking" },
    secondaryCta: { label: "Bejelentkezés", href: "/login" },
  },
  court: {
    title: "A pálya",
    lead: "Nyolc salakborítású pálya Nagykanizsán, gazdag tenisztörténelemmel.",
    paragraphs: [
      "Sportingatlanunk az E.ON Közép-dunántúli Gázhálózati Zrt. tulajdonában van. A sportpálya üzemeltetését az Energia Szabadidősport Klub látja el. Legnagyobb támogatónk az E.ON Közép-dunántúli Gázhálózati Zrt. Üzemi Tanácsa.",
      "Korábban a legendás Olajbányász SE tenisz szakosztálya működött itt. Ma a város legnagyobb szabadtéri teniszlétesítménye várja a sport szerelmeseit.",
    ],
    map: {
      label: "Megnyitás a térképen",
      href: "https://maps.app.goo.gl/jSHF7y5pYhbG2s697",
    },
  },
  mission: {
    title: "A klub célja",
    lead: "Szervezett testedzés, szabadidő és közösség — az E.ON dolgozóknak és a város sportszeretőinek.",
    paragraphs: [
      "A klub célja, hogy biztosítsa az E.ON dolgozók és közvetlen hozzátartozóik szervezett körülmények közötti testedzését és szabadidős tevékenységét.",
      "Lehetőséget biztosítunk a városban és vonzáskörzetében élő sportszerető embereknek a tenisz szabadidős gyakorlására, és segítjük a város sport- és tenisztársadalmi életének fellendítését.",
      "Sportrendezvényeket szervezünk, tagjainkat versenyeztetjük más egyesületek versenyein és sporttalálkozóin. Klubtagjainkat sportszeretetre és egészséges életmódra neveljük, kapcsolatot tartunk más sportegyesületekkel és sportszövetségekkel.",
    ],
    closing: "A munkakapcsolaton túl a baráti kapcsolatok kialakulását is elősegítjük.",
  },
  leadership: {
    title: "Vezetőség",
    intro: "Energia Szabadidősport Klub vezetősége",
    president: {
      name: "Csinger Gábor",
      role: "Elnök",
    },
    boardTitle: "Elnökségi tagok",
    board: [
      "Albrecht Erika",
      "Kiss Péter",
      "Hofstadter Szabolcs",
      "Szlávecz Tamás",
    ],
    caretaker: {
      name: "Márton József",
      role: "Pályagondnok",
    },
  },
} as const;

export type LandingContent = typeof landing;
