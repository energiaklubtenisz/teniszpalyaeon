/** Centralized public/ URL paths for brand and page media. */
export const assets = {
  brand: {
    logo: "/brand/energia_tennis_club_logo.png",
  },
  landing: {
    hero: "/images/landing/landing-hero.jpg",
  },
  pages: {
    gallery: "/images/pages/page-gallery.jpg",
    prices: "/images/pages/page-gallery.jpg",
    booking: "/images/pages/page-booking.jpg",
    contact: "/images/gallery/gallery-clay-01.jpg",
  },
  gallery: [
    {
      src: "/images/gallery/gallery-clay-01.jpg",
      alt: "Salak teniszpálya hálóval — hangulatkép",
    },
    {
      src: "/images/place/club-04.jpg",
      alt: "Ütők és labdák a salakon — a klub anyagából",
    },
    {
      src: "/images/gallery/gallery-clay-02.jpg",
      alt: "Játékos a salakpályán — hangulatkép",
    },
    {
      src: "/images/place/club-10.jpg",
      alt: "Labdaütés salakon — a klub anyagából",
    },
    {
      src: "/images/gallery/gallery-clay-03.jpg",
      alt: "Salakpálya vonalak közelről — hangulatkép",
    },
    {
      src: "/images/place/club-09.jpg",
      alt: "Klub edzőterem — Nagykanizsa, Király utca 2.",
    },
    {
      src: "/images/gallery/gallery-01.jpg",
      alt: "Szabadtéri teniszpálya — hangulatkép",
    },
    {
      src: "/images/gallery/gallery-02.jpg",
      alt: "Teniszpálya napfényben — hangulatkép",
    },
    {
      src: "/images/gallery/gallery-03.jpg",
      alt: "Pálya és környezet — hangulatkép",
    },
    {
      src: "/images/gallery/gallery-06.jpg",
      alt: "Teniszhangulat — hangulatkép",
    },
    {
      src: "/images/gallery/gallery-07.jpg",
      alt: "Sportélet a pályán — hangulatkép",
    },
    {
      src: "/images/pages/page-booking.jpg",
      alt: "Pályafoglalásra hangoló kép",
    },
  ],
} as const;

export type Assets = typeof assets;
