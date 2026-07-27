export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<
    Record<"name" | "email" | "phone" | "message", string>
  >;
};

export const initialContactFormState: ContactFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
