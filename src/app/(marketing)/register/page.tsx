import type { Metadata } from "next";

import { RegisterPage } from "@/components/feature/register/RegisterPage";
import { register } from "@/content/register";

export const metadata: Metadata = {
  title: register.title,
  description: register.support,
};

export default function RegisterRoute() {
  return <RegisterPage />;
}
