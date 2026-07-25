import type { Metadata } from "next";

import { ContactPage } from "@/components/feature/contact/ContactPage";
import { contact } from "@/content/contact";

export const metadata: Metadata = {
  title: contact.title,
  description: contact.lead,
};

export default function ContactRoute() {
  return <ContactPage />;
}
