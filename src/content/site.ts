export const site = {
  name: "Energia Szabadidősport Klub",
  description:
    "Nagykanizsa legnagyobb szabadtéri teniszpályája — 8 salakpálya, Energia Szabadidősport Klub.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://teniszpalyaeon.vercel.app",
  keywords: [
    "teniszpálya Nagykanizsa",
    "tenisz Nagykanizsa",
    "teniszpálya bérlés Nagykanizsa",
    "Energia Szabadidősport Klub",
    "E.ON teniszpálya",
    "salakpálya Nagykanizsa",
    "teniszklub Nagykanizsa",
    "teniszbérlet",
    "pályafoglalás",
    "sportegyesület Nagykanizsa",
  ],
  lang: "hu",
  nav: {
    primary: [
      { label: "Kezdőlap", href: "/" },
      { label: "Galéria", href: "/gallery" },
      { label: "Áraink", href: "/prices" },
      { label: "Foglalás", href: "/booking" },
      { label: "Kapcsolat", href: "/contact" },
    ],
    legal: [{ label: "Adatvédelmi tájékoztató", href: "/adatvedelem" }],
    auth: {
      login: { label: "Bejelentkezés", href: "/login" },
      register: { label: "Regisztráció", href: "/register" },
      admin: { label: "Adminisztráció", href: "/admin" },
      profile: { label: "Profil", href: "/profil", menuLabel: "Fiók menü" },
      myBookings: { label: "Foglalásaim", href: "/foglalasaim" },
      logout: { label: "Kijelentkezés" },
    },
  },
} as const;

export type SiteContent = typeof site;
