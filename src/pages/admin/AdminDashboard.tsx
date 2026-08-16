import { useEffect, useMemo, useState, ReactNode } from "react";
import type { AppConfig, Submission } from "../../lib/types";
import { supabase } from "../../lib/supabaseClient";
import { exportToExcel, exportToCsv } from "../../lib/export";
import { useAuth } from "../../contexts/AuthContext";
import { validateStudentForm, hasErrors, normalizePhoneNumber } from "../../lib/validation";
import type { StudentFormValues, FormErrors } from "../../lib/validation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type SortKey = "submitted_at" | "full_name";
type Tab = "submissions" | "notifications" | "settings";

interface EmailCampaign {
  id: string;
  campaign_type: string;
  initiated_by: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

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

        <div className="mt-5 flex gap-2 overflow-x-auto border-b border-ink-200">
          <TabButton active={tab === "submissions"} onClick={() => setTab("submissions")}>
            Submissions
          </TabButton>
          <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
            Notifications
          </TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
            Settings
          </TabButton>
        </div>

        {tab === "submissions" && (
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
        )}

        {tab === "notifications" && (
          <NotificationsTab totalSubmissions={submissions.length} deadline={config.deadline} />
        )}

        {tab === "settings" && <SettingsTab config={config} onSaved={loadSubmissions} />}
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
      className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${
        active ? "border-maroon-700 text-maroon-700" : "border-transparent text-ink-400"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================== SUBMISSIONS ============================== */

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    const { error } = await supabase.from("student_submissions").delete().eq("id", id);
    setDeleting(false);
    if (!error) {
      setConfirmingDelete(false);
      setSelected(null);
      onRefresh();
    }
  }

  function closeModal() {
    setSelected(null);
    setConfirmingDelete(false);
  }

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
        <button className="btn-primary px-4 py-2.5 text-sm" onClick={() => setShowAddStudent(true)}>
          + Add Student
        </button>
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
          onClick={closeModal}
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

            <div className="mt-5 flex flex-col gap-2">
              {confirmingDelete ? (
                <>
                  <p className="rounded-lg bg-maroon-50 p-3 text-sm font-medium text-maroon-700">
                    Una uhakika? Kitendo hiki hakiwezi kurudishwa.
                  </p>
                  <button
                    className="w-full rounded-lg bg-maroon-700 px-6 py-3 text-sm font-semibold text-white"
                    onClick={() => handleDelete(selected.id)}
                    disabled={deleting}
                  >
                    {deleting ? "Inafuta..." : "Ndiyo, Futa Kabisa"}
                  </button>
                  <button
                    className="btn-secondary w-full py-3 text-sm"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Ghairi
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-primary w-full" onClick={closeModal}>
                    Funga
                  </button>
                  <button
                    className="w-full rounded-lg border-2 border-maroon-700 px-6 py-3 text-sm font-semibold text-maroon-700"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    🗑 Delete This Student Information
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onAdded={() => {
            setShowAddStudent(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

function AddStudentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [email, setEmail] = useState("");
  const [values, setValues] = useState<StudentFormValues>({
    fullName: "",
    registrationNumber: "",
    phoneNumber: "",
    formFourIndexNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors & { email?: string }>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof StudentFormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const fieldErrors = validateStudentForm(values);

    if (!values.registrationNumber.trim()) {
      fieldErrors.registrationNumber = "Please enter your registration number.";
    } else {
      delete fieldErrors.registrationNumber;
    }

    const emailError =
      !email.trim() || !email.includes("@") ? "Weka email sahihi ya mwanafunzi." : undefined;
    setErrors({ ...fieldErrors, email: emailError });
    if (hasErrors(fieldErrors) || emailError) return;

    setSaving(true);
    setSubmitError(null);

    const payload = {
      google_user_id: null,
      google_email: email.trim(),
      full_name: values.fullName.trim(),
      registration_number: values.registrationNumber.trim(),
      phone_number: normalizePhoneNumber(values.phoneNumber),
      form_four_index_number: values.formFourIndexNumber.trim(),
      declaration_accepted: true,
      status: "admin_added",
    };

    const { data: inserted, error } = await supabase
      .from("student_submissions")
      .insert(payload)
      .select()
      .single();
    setSaving(false);

    if (error) {
      setSubmitError("Imeshindikana kuhifadhi. Tafadhali jaribu tena.");
      return;
    }

    supabase.functions
      .invoke("send-confirmation-email", {
        body: {
          to: payload.google_email,
          fullName: payload.full_name,
          submissionId: inserted?.id ?? null,
        },
      })
      .catch(() => {});

    onAdded();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-card sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg font-semibold text-ink-900">Add Student</h3>
        <p className="mt-1 text-sm text-ink-500">
          Ongeza taarifa za mwanafunzi moja kwa moja. Email yake itatumiwa jumbe la uthibitisho.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="field-label">Email ya Mwanafunzi</label>
            <input
              className="field-input"
              placeholder="mwanafunzi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div>
            <label className="field-label">Full Name</label>
            <input
              className="field-input"
              placeholder="Paulo Mkenya Mkenya"
              value={values.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
            />
            {errors.fullName && <p className="field-error">{errors.fullName}</p>}
          </div>

          <div>
            <label className="field-label">Registration Number</label>
            <input
              className="field-input"
              placeholder="RU/BAFIT/2024/10000"
              value={values.registrationNumber}
              onChange={(e) => updateField("registrationNumber", e.target.value)}
            />
            {errors.registrationNumber && (
              <p className="field-error">{errors.registrationNumber}</p>
            )}
          </div>

          <div>
            <label className="field-label">Phone Number</label>
            <input
              className="field-input"
              placeholder="255624847729"
              inputMode="tel"
              value={values.phoneNumber}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
            />
            {errors.phoneNumber && <p className="field-error">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="field-label">Form Four Index Number</label>
            <input
              className="field-input"
              placeholder="S0123.4567.1900"
              value={values.formFourIndexNumber}
              onChange={(e) => updateField("formFourIndexNumber", e.target.value)}
            />
            {errors.formFourIndexNumber && (
              <p className="field-error">{errors.formFourIndexNumber}</p>
            )}
          </div>

          {submitError && <p className="field-error">{submitError}</p>}

          <div className="flex flex-col gap-2">
            <button className="btn-primary w-full" onClick={handleSubmit} disabled={saving}>
              {saving ? "Inahifadhi..." : "Ongeza Mwanafunzi"}
            </button>
            <button className="btn-secondary w-full" onClick={onClose} disabled={saving}>
              Ghairi
            </button>
          </div>
        </div>
      </div>
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

/* ============================== NOTIFICATIONS ============================== */

function NotificationsTab({
  totalSubmissions,
  deadline,
}: {
  totalSubmissions: number;
  deadline: string;
}) {
  const deadlinePassed = new Date(deadline).getTime() < Date.now();

  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [confirmType, setConfirmType] = useState<"reminder" | "thankyou" | null>(null);
  const [sendingType, setSendingType] = useState<"reminder" | "thankyou" | null>(null);
  const [campaignMessage, setCampaignMessage] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    const { data } = await supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setCampaigns(data as EmailCampaign[]);
    setLoadingCampaigns(false);
  }

  async function handleSendTest() {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      setTestResult({ ok: false, message: "Weka email sahihi." });
      return;
    }
    setTestSending(true);
    setTestResult(null);
    const { data, error } = await supabase.functions.invoke("send-test-email", {
      body: { to: testEmail.trim() },
    });
    setTestSending(false);
    if (error || !data?.success) {
      setTestResult({
        ok: false,
        message: "The email could not be sent. Please check the email configuration.",
      });
    } else {
      setTestResult({ ok: true, message: "Test email accepted by the email provider." });
    }
  }

  async function handleSendCampaign(type: "reminder" | "thankyou") {
    setSendingType(type);
    setCampaignMessage(null);
    const { data, error } = await supabase.functions.invoke("send-campaign-email", {
      body: { type },
    });
    setSendingType(null);
    setConfirmType(null);
    if (error) {
      setCampaignMessage("Imeshindikana kutuma. Tafadhali jaribu tena.");
    } else {
      setCampaignMessage(
        `Imekamilika: ${data.sent} zimetumwa, ${data.failed} zimeshindwa (kati ya ${totalSubmissions}).`
      );
    }
    loadCampaigns();
  }

  async function handleRetry(campaignId: string) {
    setRetryingId(campaignId);
    const { data, error } = await supabase.functions.invoke("send-campaign-email", {
      body: { retryCampaignId: campaignId },
    });
    setRetryingId(null);
    if (!error && data) {
      setCampaignMessage(`Retry: ${data.sent} zimefanikiwa, ${data.failed} bado zimeshindwa.`);
    }
    loadCampaigns();
  }

  return (
    <div className="mt-5 space-y-5">
      {/* TEST EMAIL */}
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <h2 className="font-serif text-base font-semibold text-ink-900">Send Test Email</h2>
        <p className="mt-1 text-sm text-ink-500">
          Tuma email ya majaribio kabla ya kutuma kwa wanafunzi wote.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="field-input sm:flex-1"
            placeholder="jaribio@gmail.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button
            className="btn-secondary px-5 py-3.5 text-sm"
            onClick={handleSendTest}
            disabled={testSending}
          >
            {testSending ? "Inatuma..." : "Send Test Email"}
          </button>
        </div>
        {testResult && (
          <p
            className={`mt-2 text-sm font-medium ${
              testResult.ok ? "text-green-700" : "text-maroon-700"
            }`}
          >
            {testResult.ok ? "✅ " : "❌ "}
            {testResult.message}
          </p>
        )}
      </div>

      {/* CAMPAIGNS */}
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <h2 className="font-serif text-base font-semibold text-ink-900">Mass Notifications</h2>
        <p className="mt-1 text-sm text-ink-500">
          Wapokeaji: <span className="font-semibold text-ink-800">{totalSubmissions}</span>{" "}
          wanafunzi walioleta taarifa.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            className="btn-secondary flex-1 px-4 py-3 text-sm"
            onClick={() => setConfirmType("reminder")}
            disabled={sendingType !== null || totalSubmissions === 0}
          >
            📩 Tuma Kumbukumbu ya Deadline
          </button>
          <button
            className="btn-secondary flex-1 px-4 py-3 text-sm"
            onClick={() => setConfirmType("thankyou")}
            disabled={sendingType !== null || totalSubmissions === 0 || !deadlinePassed}
          >
            📩 Tuma Ahsante kwa Wote
          </button>
        </div>
        {!deadlinePassed && (
          <p className="mt-2 text-xs text-ink-400">
            Thank-you communication will be available after the submission deadline.
          </p>
        )}
        {campaignMessage && (
          <p className="mt-2 text-sm font-medium text-maroon-700">{campaignMessage}</p>
        )}
      </div>

      {/* HISTORY */}
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <h2 className="font-serif text-base font-semibold text-ink-900">Campaign History</h2>
        {loadingCampaigns ? (
          <p className="mt-3 text-sm text-ink-400">Inapakia...</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">Hakuna campaign iliyotumwa bado.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-lg border border-ink-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">
                    {c.campaign_type === "thankyou" ? "Ahsante" : "Kumbukumbu ya Deadline"}
                  </p>
                  <p className="text-xs text-ink-400">
                    {new Date(c.created_at).toLocaleString("en-GB", {
                      timeZone: "Africa/Dar_es_Salaam",
                    })}
                  </p>
                </div>
                <p className="mt-1 text-xs text-ink-500">Na: {c.initiated_by}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <span className="text-ink-600">Wapokeaji: {c.recipients_count}</span>
                  <span className="text-green-700">Zimetumwa: {c.sent_count}</span>
                  <span className="text-maroon-700">Zimeshindwa: {c.failed_count}</span>
                </div>
                {c.failed_count > 0 && (
                  <button
                    className="btn-secondary mt-3 w-full py-2 text-xs"
                    onClick={() => handleRetry(c.id)}
                    disabled={retryingId !== null}
                  >
                    {retryingId === c.id ? "Inajaribu tena..." : "🔁 Retry Failed Emails"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmType(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-lg font-semibold text-ink-900">
              Are you sure you want to send this to all eligible students?
            </h3>
            <p className="mt-2 text-sm text-ink-600">
              You are about to send this message to {totalSubmissions} students.
            </p>
            <p className="mt-2 text-sm font-medium text-ink-800">
              I understand that this will send an email to all eligible recipients.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                className="btn-primary w-full"
                onClick={() => handleSendCampaign(confirmType)}
                disabled={sendingType !== null}
              >
                {sendingType ? "Inatuma..." : "Ndiyo, Tuma"}
              </button>
              <button
                className="btn-secondary w-full"
                onClick={() => setConfirmType(null)}
                disabled={sendingType !== null}
              >
                Ghairi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsTab({ config, onSaved }: { config: AppConfig; onSaved: () => void }) {
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
