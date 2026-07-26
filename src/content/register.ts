export const register = {
  title: "Regisztráció",
  support: "Hozza létre fiókját a pályafoglaláshoz.",
  submit: "Regisztráció",
  submitting: "Regisztráció…",
  loginPrompt: "Már van fiókja?",
  loginLink: "Bejelentkezés",
  fields: {
    fullName: { label: "Teljes név" },
    email: { label: "Email" },
    password: { label: "Jelszó" },
    passwordConfirm: { label: "Jelszó megerősítése" },
  },
  success: {
    title: "Sikeres regisztráció",
    support:
      "Fiókja elkészült. Jelentkezzen be, hogy foglalhasson pályát.",
    loginCta: "Bejelentkezés",
  },
} as const;

export type RegisterContent = typeof register;
