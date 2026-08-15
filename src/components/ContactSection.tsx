import type { AppConfig } from "../lib/types";

function telHref(phone: string) {
  const digits = phone.replace(/\s|-/g, "");
  return `tel:${digits.startsWith("0") ? "+255" + digits.slice(1) : digits}`;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "255" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

function LeaderCard({ role, name, phone }: { role: string; name: string; phone: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-widest text-maroon-700">{role}</p>
      <p className="mt-1 font-serif text-base font-semibold text-ink-900">{name}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={telHref(phone)}
          className="rounded-md bg-ink-50 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
        >
          📞 {phone}
        </a>
        <a
          href={whatsappHref(phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function ContactSection({ config }: { config: AppConfig }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="font-serif text-lg font-semibold text-ink-900">
        Mawasiliano ya Viongozi
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <LeaderCard role="Minister" name={config.minister_name} phone={config.minister_phone} />
        <LeaderCard
          role="Deputy Minister"
          name={config.deputy_minister_name}
          phone={config.deputy_minister_phone}
        />
        <LeaderCard role="Secretary" name={config.secretary_name} phone={config.secretary_phone} />
      </div>
      <div className="mt-3 rounded-lg border border-ink-100 bg-white p-4 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-maroon-700">Email</p>
        <a
          href={`mailto:${config.contact_email}`}
          className="mt-1 block break-all text-sm font-medium text-maroon-700 underline"
        >
          {config.contact_email}
        </a>
      </div>
    </section>
  );
}
