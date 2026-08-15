import { useState, FormEvent } from "react";
import type { AppConfig } from "../lib/types";
import type { StudentFormValues, FormErrors } from "../lib/validation";
import { validateStudentForm, hasErrors, normalizePhoneNumber } from "../lib/validation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import PageShell from "../components/PageShell";
import ProgressIndicator from "../components/ProgressIndicator";

type Step = "form" | "review" | "declaration" | "success";

const EMPTY_VALUES: StudentFormValues = {
  fullName: "",
  registrationNumber: "",
  phoneNumber: "",
  formFourIndexNumber: "",
};

export default function Wizard({
  config,
  onSubmitted,
}: {
  config: AppConfig;
  onSubmitted: () => void;
}) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<StudentFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof StudentFormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleContinueToReview(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validateStudentForm(values);
    setErrors(nextErrors);
    if (!hasErrors(nextErrors)) {
      setStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleFinalSubmit() {
    if (!user || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      google_user_id: user.id,
      google_email: user.email,
      full_name: values.fullName.trim(),
      registration_number: values.registrationNumber.trim(),
      phone_number: normalizePhoneNumber(values.phoneNumber),
      form_four_index_number: values.formFourIndexNumber.trim(),
      declaration_accepted: true,
    };

    const { error } = await supabase.from("student_submissions").insert(payload);

    if (error) {
      setSubmitting(false);
      if (error.code === "23505") {
        // Unique constraint violation -> duplicate submission
        setSubmitError(
          "Google account hii tayari imetumika kuwasilisha taarifa. Kila Google account inaruhusiwa kuwasilisha taarifa mara moja tu."
        );
      } else if (error.message?.toLowerCase().includes("deadline")) {
        setSubmitError("Muda wa kuwasilisha taarifa umefikia mwisho.");
      } else {
        setSubmitError(
          "Samahani, kuna tatizo la kiufundi. Taarifa zako hazijawasilishwa. Tafadhali jaribu tena."
        );
      }
      return;
    }

   // Tuma email ya uthibitisho (kama itashindikana, submission bado imehifadhiwa)
    supabase.functions.invoke("send-confirmation-email", {
      body: { to: payload.google_email, fullName: payload.full_name },
    }).catch(() => {});

    setSubmitting(false);
    onSubmitted();
  }

  return (
    <PageShell config={config} showContact={step === "form"}>
      <div className="space-y-5">
        <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <ProgressIndicator step={step === "form" ? 1 : step === "review" ? 2 : 3} />
        </div>

        {step === "form" && (
          <form
            onSubmit={handleContinueToReview}
            className="space-y-5 rounded-xl border border-ink-100 bg-white p-5 shadow-card sm:p-6"
            noValidate
          >
            <div>
              <h1 className="font-serif text-lg font-semibold text-ink-900">
                Taarifa za Mwanafunzi
              </h1>
              <p className="mt-1 text-sm text-ink-500">
                Umeingia kama <span className="font-medium text-ink-700">{user?.email}</span>
              </p>
            </div>

            <div>
              <label className="field-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                className="field-input"
                placeholder="Paulo Mkenya Mkenya"
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
              />
              {errors.fullName && <p className="field-error">{errors.fullName}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="registrationNumber">
                Registration Number
              </label>
              <input
                id="registrationNumber"
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
              <label className="field-label" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                className="field-input"
                placeholder="255624847729"
                inputMode="tel"
                autoComplete="tel"
                value={values.phoneNumber}
                onChange={(e) => updateField("phoneNumber", e.target.value)}
              />
              {errors.phoneNumber && <p className="field-error">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="field-label" htmlFor="formFourIndexNumber">
                Form Four Index Number
              </label>
              <input
                id="formFourIndexNumber"
                className="field-input"
                placeholder="S0123.4567.1900"
                value={values.formFourIndexNumber}
                onChange={(e) => updateField("formFourIndexNumber", e.target.value)}
              />
              {errors.formFourIndexNumber && (
                <p className="field-error">{errors.formFourIndexNumber}</p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full">
              Endelea kwenye Ukaguzi
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full text-center text-sm font-medium text-ink-400 underline"
            >
              Toka kwenye akaunti hii
            </button>
          </form>
        )}

        {step === "review" && (
          <div className="space-y-5 rounded-xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            <h1 className="font-serif text-lg font-semibold text-ink-900">
              Review Your Information
            </h1>
            <div className="rounded-lg border-2 border-gold-400 bg-gold-50 p-3 text-sm text-ink-800">
              <p className="font-semibold">TAFADHALI KAGUA TAARIFA ZAKO KWA UMAKINI</p>
              <p className="mt-1">
                Hakikisha taarifa zote ni sahihi. Baada ya kubofya SUBMIT, huwezi kubadilisha
                taarifa zako.
              </p>
            </div>

            <dl className="divide-y divide-ink-100 rounded-lg border border-ink-100">
              <ReviewRow label="Google Account" value={user?.email ?? ""} />
              <ReviewRow label="Full Name" value={values.fullName} />
              <ReviewRow label="Registration Number" value={values.registrationNumber} />
              <ReviewRow
                label="Phone Number"
                value={normalizePhoneNumber(values.phoneNumber)}
              />
              <ReviewRow
                label="Form Four Index Number"
                value={values.formFourIndexNumber}
              />
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => {
                  setStep("declaration");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Confirm Information
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setStep("form")}
              >
                Edit Information
              </button>
            </div>
          </div>
        )}

        {step === "declaration" && (
          <div className="space-y-5 rounded-xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
            <h1 className="font-serif text-lg font-semibold text-ink-900">
              Uthibitisho / Declaration
            </h1>
            <p className="rounded-lg bg-ink-50 p-4 text-[15px] leading-relaxed text-ink-800">
              Ninathibitisha kuwa taarifa nilizotoa ni za kweli na sahihi. Ninathibitisha
              kuwa ninaendelea na masomo katika Ruaha Catholic University na sijapata
              mkopo wa HESLB kwa mwaka wa masomo 2026/2027. Ninaelewa kuwa baada ya
              kuwasilisha taarifa hizi siwezi kuzibadilisha au kuwasilisha tena kwa Google
              account hii.
            </p>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-ink-200 p-4 has-[:checked]:border-maroon-600 has-[:checked]:bg-maroon-50">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-maroon-700"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
              />
              <span className="text-sm font-medium text-ink-800">
                I confirm that the information provided above is true and accurate.
              </span>
            </label>

            {submitError && (
              <p className="rounded-lg bg-maroon-50 p-3 text-sm font-medium text-maroon-700">
                {submitError}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={!declarationChecked || submitting}
                onClick={handleFinalSubmit}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Inawasilisha...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                disabled={submitting}
                onClick={() => setStep("review")}
              >
                Rudi Nyuma
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="text-[15px] font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}
