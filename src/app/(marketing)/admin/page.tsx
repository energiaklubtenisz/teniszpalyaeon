import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-6 py-16">
      <p className="text-center text-lg text-[var(--graphite)]">
        Itt lesz az adminisztrációs felület
      </p>
    </main>
  );
}
