export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white py-6">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <p className="text-xs text-ink-400">
          © {new Date().getFullYear()} Ruaha Catholic University — RUCU Students Organization
          (RUCUSO). Ministry of Loans and Sponsorship.
        </p>
        <p className="mt-1 text-xs text-ink-300">Taarifa zako ni siri na zinalindwa.</p>
      </div>
    </footer>
  );
}
