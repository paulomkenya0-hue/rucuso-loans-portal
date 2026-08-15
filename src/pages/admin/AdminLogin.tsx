import { useState } from "react";
import type { AppConfig } from "../../lib/types";
import { useAuth } from "../../contexts/AuthContext";
import PageShell from "../../components/PageShell";
import GoogleLoginButton from "../../components/GoogleLoginButton";

export default function AdminLogin({
  config,
  notAuthorized,
}: {
  config: AppConfig;
  notAuthorized: boolean;
}) {
  const { signInWithGoogle, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await signInWithGoogle();
  }

  return (
    <PageShell config={config} showContact={false}>
      <section className="rounded-xl border border-ink-100 bg-white p-6 shadow-card">
        <h1 className="font-serif text-lg font-semibold text-ink-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          Ingia kwa akaunti ya Google iliyoruhusiwa kusimamia mfumo.
        </p>

        {notAuthorized && (
          <div className="mt-4 space-y-3 rounded-lg bg-maroon-50 p-4">
            <p className="text-sm font-medium text-maroon-700">
              Akaunti hii ya Google haina ruhusa ya kuingia kwenye dashibodi ya admin.
            </p>
            <button onClick={() => signOut()} className="btn-secondary w-full">
              Jaribu akaunti nyingine
            </button>
          </div>
        )}

        {!notAuthorized && (
          <div className="mt-5">
            <GoogleLoginButton onClick={handleLogin} loading={loading} />
          </div>
        )}
      </section>
    </PageShell>
  );
}
