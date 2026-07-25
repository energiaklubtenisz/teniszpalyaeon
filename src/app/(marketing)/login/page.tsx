import type { Metadata } from "next";

import { LoginPage } from "@/components/feature/login/LoginPage";
import { login } from "@/content/login";

export const metadata: Metadata = {
  title: login.title,
  description: login.support,
};

export default function LoginRoute() {
  return <LoginPage />;
}
