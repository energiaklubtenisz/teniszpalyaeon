export type ProfileFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<Record<"fullName" | "phone", string>>;
};

export const initialProfileFormState: ProfileFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type PasswordFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: Partial<
    Record<"currentPassword" | "password" | "passwordConfirm", string>
  >;
};

export const initialPasswordFormState: PasswordFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type DeleteAccountFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<"password" | "confirm", string>>;
};

export const initialDeleteAccountFormState: DeleteAccountFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type AvatarFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  avatarUrl?: string | null;
};

export const initialAvatarFormState: AvatarFormState = {
  status: "idle",
  message: null,
  avatarUrl: null,
};
