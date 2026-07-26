export const site = {
  name: "Energia Szabadidősport Klub",
  description:
    "Nagykanizsa legnagyobb szabadtéri teniszpályája — 8 salakpálya, Energia Szabadidősport Klub.",
  lang: "hu",
  nav: {
    primary: [
      { label: "Kezdőlap", href: "/" },
      { label: "Galéria", href: "/gallery" },
      { label: "Áraink", href: "/prices" },
      { label: "Foglalás", href: "/booking" },
      { label: "Kapcsolat", href: "/contact" },
    ],
    auth: {
      login: { label: "Bejelentkezés", href: "/login" },
      register: { label: "Regisztráció", href: "/register" },
      logout: { label: "Kijelentkezés" },
    },
  },
} as const;

export type SiteContent = typeof site;
