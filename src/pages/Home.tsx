import { useState } from "react";
import type { AppConfig } from "../lib/types";
import { useAuth } from "../contexts/AuthContext";
import PageShell from "../components/PageShell";
import Announcement from "../components/Announcement";
import DeadlineBanner from "../components/DeadlineBanner";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Home({ config }: { config: AppConfig }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleLogin() {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError("Imeshindikana kuunganisha na Google. Tafadhali jaribu tena.");
      setLoading(false);
    }
  }

  return (
    <PageShell config={config}>
      <div className="space-y-5">
        <DeadlineBanner deadline={config.deadline} />
        <Announcement config={config} />

        <section className="rounded-xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-serif text-lg font-semibold text-ink-900">
            Anza kwa Kuingia na Google
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Tumia akaunti yako ya Google kuingia kwenye mfumo. Kila akaunti ya Google
            inaruhusiwa kuwasilisha taarifa mara moja tu.
          </p>
          <div className="mt-4">
            <GoogleLoginButton onClick={handleLogin} loading={loading} />
          </div>
          {authError && <p className="field-error">{authError}</p>}
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
          <h2 className="font-serif text-base font-semibold text-ink-900">Privacy Notice</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Taarifa utakazowasilisha ni taarifa binafsi za mwanafunzi. Taarifa hizi
            zitatumika kwa madhumuni ya uratibu, ufuatiliaji na kushughulikia masuala
            yanayohusiana na mikopo na udhamini wa wanafunzi. Taarifa zako hazitawekwa
            hadharani wala kutumika kwa madhumuni yasiyohusiana.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
