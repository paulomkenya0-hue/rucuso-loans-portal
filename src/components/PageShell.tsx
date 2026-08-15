import { ReactNode } from "react";
import type { AppConfig } from "../lib/types";
import Header from "./Header";
import Footer from "./Footer";
import ContactSection from "./ContactSection";

export default function PageShell({
  config,
  children,
  showContact = true,
}: {
  config: AppConfig;
  children: ReactNode;
  showContact?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Header config={config} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      {showContact && <ContactSection config={config} />}
      <Footer />
    </div>
  );
}
