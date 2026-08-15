import type { AppConfig } from "../lib/types";
import PageShell from "../components/PageShell";

export default function Closed({ config }: { config: AppConfig }) {
  return (
    <PageShell config={config}>
      <section className="rounded-xl border-2 border-maroon-700 bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon-50">
          <span className="text-2xl">⏱</span>
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-maroon-700">
          MAOMBI YAMEFUNGWA
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
          Muda wa kujaza taarifa ulifikia mwisho tarehe 17/08/2026 saa 6:00 mchana.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
          Kwa maelekezo zaidi, tafadhali wasiliana na viongozi wa RUCUSO.
        </p>
      </section>
    </PageShell>
  );
}
