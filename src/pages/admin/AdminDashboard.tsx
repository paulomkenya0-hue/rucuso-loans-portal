import { useEffect, useMemo, useState, ReactNode } from "react";
import type { AppConfig, Submission } from "../../lib/types";
import { supabase } from "../../lib/supabaseClient";
import { exportToExcel, exportToCsv } from "../../lib/export";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type SortKey = "submitted_at" | "full_name";
type Tab = "submissions" | "settings";

export default function AdminDashboard({ config }: { config: AppConfig }) {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("submissions");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("student_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (!error && data) setSubmissions(data as Submission[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = submissions;
    if (q) {
      rows = rows.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.registration_number.toLowerCase().includes(q) ||
          s.phone_number.toLowerCase().includes(q) ||
          s.form_four_index_number.toLowerCase().includes(q) ||
          s.google_email.toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "full_name") return a.full_name.localeCompare(b.full_name) * dir;
      return (
        (new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()) * dir
      );
    });
    return sorted;
  }, [submissions, query, sortKey, sortDir]);

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Header config={config} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl font-semibold text-ink-900">Admin Dashboard</h1>
            <p className="text-sm text-ink-500">Umeingia kama {user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="btn-secondary px-4 py-2 text-sm">
            Toka
          </button>
        </div>

        <div className="mt-5 flex gap-2 border-b border-ink-200">
          <TabButton active={tab === "submissions"} onClick={() => setTab("submissions")}>
            Submissions
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
            Settings
          </TabButton>
        </div>

        {tab === "submissions" ? (
          <SubmissionsTab
            submissions={filtered}
            total={submissions.length}
            loading={loading}
            query={query}
            setQuery={setQuery}
            sortKey={sortKey}
            setSortKey={setSortKey}
            sortDir={sortDir}
            setSortDir={setSortDir}
            selected={selected}
            setSelected={setSelected}
            onRefresh={loadSubmissions}
          />
        ) : (
          <SettingsTab config={config} onSaved={loadSubmissions} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${
        active ? "border-maroon-700 text-maroon-700" : "border-transparent text-ink-400"
      }`}
    >
      {children}
    </button>
  );
}

function SubmissionsTab({
  submissions,
  total,
  loading,
  query,
  setQuery,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  selected,
  setSelected,
  onRefresh,
}: {
  submissions: Submission[];
  total: number;
  loading: boolean;
  query: string;
  setQuery: (v: string) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  sortDir: "asc" | "desc";
  setSortDir: (v: "asc" | "desc") => void;
  selected: Submission | null;
  setSelected: (v: Submission | null) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Submissions" value={total} />
        <StatCard label="Matching Filter" value={submissions.length} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <input
          className="field-input sm:flex-1"
          placeholder="Search by name, reg. number, phone, or index number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="field-input"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="submitted_at">Sort: Submission time</option>
            <option value="full_name">Sort: Name</option>
          </select>
          <button
            className="btn-secondary px-4"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            aria-label="Toggle sort direction"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="btn-secondary px-4 py-2.5 text-sm"
          onClick={() => exportToExcel(submissions)}
          disabled={submissions.length === 0}
        >
          ⬇ Export to Excel
        </button>
        <button
          className="btn-secondary px-4 py-2.5 text-sm"
          onClick={() => exportToCsv(submissions)}
          disabled={submissions.length === 0}
        >
          ⬇ Export to CSV
        </button>
        <button className="btn-secondary px-4 py-2.5 text-sm" onClick={onRefresh}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-ink-100 bg-white p-8 text-center text-ink-400 shadow-card">
          Inapakia...
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-ink-100 bg-white p-8 text-center text-ink-500 shadow-card">
          No student submissions yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Registration No.</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{s.full_name}</td>
                  <td className="px-4 py-3 text-ink-600">{s.registration_number}</td>
                  <td className="px-4 py-3 text-ink-600">{s.phone_number}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(s.submitted_at).toLocaleString("en-GB", {
                      timeZone: "Africa/Dar_es_Salaam",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-sm font-semibold text-maroon-700 underline"
                      onClick={() => setSelected(s)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-card sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-ink-900">Submission Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Google Email" value={selected.google_email} />
              <Detail label="Full Name" value={selected.full_name} />
              <Detail label="Registration Number" value={selected.registration_number} />
              <Detail label="Phone Number" value={selected.phone_number} />
              <Detail label="Form Four Index Number" value={selected.form_four_index_number} />
              <Detail
                label="Submitted At"
                value={new Date(selected.submitted_at).toLocaleString("en-GB", {
                  timeZone: "Africa/Dar_es_Salaam",
                })}
              />
              <Detail label="Status" value={selected.status} />
            </dl>
            <button className="btn-primary mt-5 w-full" onClick={() => setSelected(null)}>
              Funga
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-ink-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase text-ink-400">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-maroon-700">{value}</p>
    </div>
  );
}

function SettingsTab({ config, onSaved }: { config: AppConfig; onSaved: () => void }) {
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Deadline input uses local datetime-local format
  const deadlineLocal = useMemo(() => {
    const d = new Date(form.deadline);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }, [form.deadline]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("app_config")
      .update({
        deadline: form.deadline,
        minister_name: form.minister_name,
        minister_phone: form.minister_phone,
        deputy_minister_name: form.deputy_minister_name,
        deputy_minister_phone: form.deputy_minister_phone,
        secretary_name: form.secretary_name,
        secretary_phone: form.secretary_phone,
        contact_email: form.contact_email,
        announcement_text: form.announcement_text,
        organization_name: form.organization_name,
      })
      .eq("id", true);
    setSaving(false);
    if (error) {
      setMessage("Imeshindikana kuhifadhi mabadiliko. Tafadhali jaribu tena.");
    } else {
      setMessage("Mabadiliko yamehifadhiwa.");
      onSaved();
    }
  }

  return (
    <div className="mt-5 space-y-5 rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <div>
        <label className="field-label">Deadline (Africa/Dar_es_Salaam, your local browser time)</label>
        <input
          type="datetime-local"
          className="field-input"
          value={deadlineLocal}
          onChange={(e) =>
            setForm((f) => ({ ...f, deadline: new Date(e.target.value).toISOString() }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Minister Name"
          value={form.minister_name}
          onChange={(v) => setForm((f) => ({ ...f, minister_name: v }))}
        />
        <TextField
          label="Minister Phone"
          value={form.minister_phone}
          onChange={(v) => setForm((f) => ({ ...f, minister_phone: v }))}
        />
        <TextField
          label="Deputy Minister Name"
          value={form.deputy_minister_name}
          onChange={(v) => setForm((f) => ({ ...f, deputy_minister_name: v }))}
        />
        <TextField
          label="Deputy Minister Phone"
          value={form.deputy_minister_phone}
          onChange={(v) => setForm((f) => ({ ...f, deputy_minister_phone: v }))}
        />
        <TextField
          label="Secretary Name"
          value={form.secretary_name}
          onChange={(v) => setForm((f) => ({ ...f, secretary_name: v }))}
        />
        <TextField
          label="Secretary Phone"
          value={form.secretary_phone}
          onChange={(v) => setForm((f) => ({ ...f, secretary_phone: v }))}
        />
        <TextField
          label="Contact Email"
          value={form.contact_email}
          onChange={(v) => setForm((f) => ({ ...f, contact_email: v }))}
        />
        <TextField
          label="Organization Name"
          value={form.organization_name}
          onChange={(v) => setForm((f) => ({ ...f, organization_name: v }))}
        />
      </div>

      <div>
        <label className="field-label">Announcement Text</label>
        <textarea
          className="field-input min-h-[120px]"
          value={form.announcement_text}
          onChange={(e) => setForm((f) => ({ ...f, announcement_text: e.target.value }))}
        />
      </div>

      <p className="text-xs text-ink-400">
        Logo upload: run{" "}
        <code className="rounded bg-ink-100 px-1 py-0.5">
          update app_config set logo_url = '...'
        </code>{" "}
        after uploading the official logo to Supabase Storage. See the README for steps.
      </p>

      {message && <p className="text-sm font-medium text-maroon-700">{message}</p>}

      <button className="btn-primary w-full sm:w-auto" onClick={handleSave} disabled={saving}>
        {saving ? "Inahifadhi..." : "Save Changes"}
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
