import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useAppConfig } from "./lib/useAppConfig";
import { supabase } from "./lib/supabaseClient";
import type { Submission } from "./lib/types";

import Home from "./pages/Home";
import Closed from "./pages/Closed";
import AlreadySubmitted from "./pages/AlreadySubmitted";
import Wizard from "./pages/Wizard";
import Success from "./pages/Success";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-maroon-700" />
    </div>
  );
}

/** The student-facing journey: gated by auth, deadline, and prior submission. */
function StudentApp() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: configLoading } = useAppConfig();
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingSubmission(false);
      return;
    }
    let active = true;
    setCheckingSubmission(true);
    supabase
      .from("student_submissions")
      .select("*")
      .eq("google_user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setSubmission((data as Submission) ?? null);
          setCheckingSubmission(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || configLoading) return <FullScreenLoader />;

  if (!user) return <Home config={config} />;

  if (checkingSubmission) return <FullScreenLoader />;

  const deadlinePassed = new Date(config.deadline).getTime() < Date.now();

  if (justSubmitted || submission) {
    if (justSubmitted) return <Success config={config} />;
    return <AlreadySubmitted config={config} submission={submission} />;
  }

  if (deadlinePassed) return <Closed config={config} />;

  return <Wizard config={config} onSubmitted={() => setJustSubmitted(true)} />;
}

/** The admin journey: gated by auth + membership in the admins table. */
function AdminApp() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: configLoading } = useAppConfig();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingAdmin(false);
      return;
    }
    let active = true;
    setCheckingAdmin(true);
    supabase
      .from("admins")
      .select("email")
      .eq("email", user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setIsAdmin(Boolean(data));
          setCheckingAdmin(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || configLoading) return <FullScreenLoader />;

  if (!user) return <AdminLogin config={config} notAuthorized={false} />;

  if (checkingAdmin) return <FullScreenLoader />;

  if (!isAdmin) return <AdminLogin config={config} notAuthorized />;

  return <AdminDashboard config={config} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentApp />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
