import { useEffect, useState } from "react";

function formatDeadline(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Dar_es_Salaam",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

export default function DeadlineBanner({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => setRemaining(getRemaining(deadline)), 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <section className="rounded-xl border-2 border-maroon-700 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-maroon-700">
            Deadline / Mwisho wa Muda
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-ink-900 sm:text-xl">
            {formatDeadline(deadline)}
          </p>
          <p className="text-xs text-ink-500">Muda wa Afrika Mashariki (Tanzania)</p>
        </div>
        <div className="shrink-0 rounded-full bg-maroon-700 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase text-gold-200">Inabaki</p>
          <p className="text-sm font-bold text-white">
            {remaining ? `${remaining.days}d ${remaining.hours}h` : "Imefungwa"}
          </p>
        </div>
      </div>
    </section>
  );
}
