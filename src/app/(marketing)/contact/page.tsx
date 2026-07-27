import type { Metadata } from "next";

import { ContactPage } from "@/components/feature/contact/ContactPage";
import { contact } from "@/content/contact";

export const metadata: Metadata = {
  title: contact.title,
  description: contact.lead,
};

type ContactRouteProps = {
  searchParams: Promise<{ help?: string }>;
};

export default async function ContactRoute({ searchParams }: ContactRouteProps) {
  const params = await searchParams;
  return <ContactPage helpTopic={params.help ?? null} />;
}
