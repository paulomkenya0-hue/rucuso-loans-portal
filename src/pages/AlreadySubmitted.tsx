import type { AppConfig, Submission } from "../lib/types";
import PageShell from "../components/PageShell";
import { useAuth } from "../contexts/AuthContext";

export default function AlreadySubmitted({
  config,
  submission,
}: {
  config: AppConfig;
  submission: Submission | null;
}) {
  const { signOut } = useAuth();

  return (
    <PageShell config={config}>
      <section className="rounded-xl border-2 border-maroon-700 bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon-50">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-maroon-700">
          TAARIFA ZAKO ZIMESHAWASILISHWA
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
          Google account hii tayari imetumika kuwasilisha taarifa.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
          Kila Google account inaruhusiwa kuwasilisha taarifa mara moja tu.
        </p>
        {submission && (
          <div className="mt-5 rounded-lg bg-ink-50 p-4 text-left text-sm">
            <p className="text-ink-500">
              Iliwasilishwa:{" "}
              <span className="font-medium text-ink-800">
                {new Date(submission.submitted_at).toLocaleString("en-GB", {
                  timeZone: "Africa/Dar_es_Salaam",
                })}
              </span>
            </p>
            <p className="mt-1 text-ink-500">
              Jina: <span className="font-medium text-ink-800">{submission.full_name}</span>
            </p>
          </div>
        )}
        <button onClick={() => signOut()} className="btn-secondary mt-6 w-full">
          Toka (Sign out)
        </button>
      </section>
    </PageShell>
  );
}
