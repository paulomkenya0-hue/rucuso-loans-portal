import type { AppConfig } from "../lib/types";
import PageShell from "../components/PageShell";
import { useAuth } from "../contexts/AuthContext";

export default function Success({ config }: { config: AppConfig }) {
  const { signOut } = useAuth();

  return (
    <PageShell config={config}>
      <section className="rounded-xl border-2 border-green-600 bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <span className="text-3xl text-green-600">✓</span>
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-green-700">
          TAARIFA ZAKO ZIMEPOKELEWA ✓
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
          Tunakuthibitishia kuwa taarifa zako zimepokelewa na MINISTRY OF LOANS AND
          SPONSORSHIP – RUCUSO na zinafanyiwa kazi kwa ajili ya hatua zinazofuata.
        </p>
        <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm font-medium text-ink-800">
          Muhimu: Taarifa zako tayari zimewasilishwa. Huwezi kuwasilisha tena taarifa
          kupitia Google account hii.
        </p>
        <button onClick={() => signOut()} className="btn-secondary mt-6 w-full">
          Toka (Sign out)
        </button>
      </section>
    </PageShell>
  );
}
