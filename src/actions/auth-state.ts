export type RegisterFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<
    Record<
      "fullName" | "email" | "password" | "passwordConfirm" | "privacyAccepted",
      string
    >
  >;
};

export const initialRegisterFormState: RegisterFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type LoginFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<"email" | "password", string>>;
};

export const initialLoginFormState: LoginFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
