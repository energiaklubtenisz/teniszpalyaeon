export const login = {
  title: "Bejelentkezés",
  support: "Jelentkezzen be a pályafoglaláshoz.",
  submit: "Bejelentkezés",
  submitting: "Bejelentkezés…",
  registerPrompt: "Még nincs fiókja?",
  registerLink: "Regisztráció",
  notices: {
    login: "Sikeres bejelentkezés.",
    logout: "Sikeres kijelentkezés.",
  },
  fields: {
    email: { label: "Email" },
    password: { label: "Jelszó" },
  },
} as const;

export type LoginContent = typeof login;
