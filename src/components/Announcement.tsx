import type { AppConfig } from "../lib/types";

export default function Announcement({ config }: { config: AppConfig }) {
  return (
    <section
      aria-labelledby="announcement-heading"
      className="rounded-xl border border-gold-300 bg-gold-50 p-5 shadow-card sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-maroon-700">
        Taarifa Muhimu kwa Wanafunzi
      </p>
      <h2 id="announcement-heading" className="sr-only">
        Important student announcement
      </h2>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-800">
        {config.announcement_text}
      </p>
      <div className="mt-4 rounded-lg border-2 border-maroon-700 bg-maroon-700 px-4 py-3">
        <p className="text-sm font-bold uppercase tracking-wide text-white">
          Mfumo huu ni kwa ajili ya wanafunzi wasio na mkopo wa HESLB kwa sasa
        </p>
        <p className="mt-0.5 text-xs font-medium text-gold-200">
          This system is only for students who do not currently have a HESLB loan.
        </p>
      </div>
    </section>
  );
}
