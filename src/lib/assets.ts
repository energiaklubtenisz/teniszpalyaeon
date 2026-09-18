/** Centralized public/ URL paths for brand and page media. */
export const assets = {
  brand: {
    logo: "/brand/energia_tennis_club_logo.png",
  },
  landing: {
    hero: "/images/landing/landing-hero.jpg",
  },
  pages: {
    prices: "/images/pages/page-prices.jpg",
    booking: "/images/pages/page-booking.jpg",
    contact: "/images/pages/page-contact.jpg",
  },
} as const;

export type Assets = typeof assets;
