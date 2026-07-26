import type { Metadata } from "next";

import { RegisterSuccessPage } from "@/components/feature/register/RegisterSuccessPage";
import { register } from "@/content/register";

export const metadata: Metadata = {
  title: register.success.title,
  description: register.success.support,
};

export default function RegisterSuccessRoute() {
  return <RegisterSuccessPage />;
}
