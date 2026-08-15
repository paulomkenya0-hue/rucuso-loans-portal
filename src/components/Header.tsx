import type { AppConfig } from "../lib/types";

export default function Header({ config }: { config: AppConfig }) {
  return (
    <header className="border-b-4 border-gold-500 bg-maroon-700 text-white">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full seal-ring">
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt="Ruaha Catholic University logo"
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <span className="font-serif text-lg font-bold text-white">RCU</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-serif text-[15px] font-semibold leading-tight tracking-wide sm:text-lg">
            RUAHA CATHOLIC UNIVERSITY
          </p>
          <p className="mt-0.5 text-xs font-medium text-gold-200 sm:text-sm">
            {config.organization_name}
          </p>
          <p className="text-xs text-maroon-100 sm:text-sm">
            Ministry of Loans and Sponsorship
          </p>
        </div>
      </div>
    </header>
  );
}
