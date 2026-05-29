"use client";

import { Chrome, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, firebaseReady, firebaseUser, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (firebaseUser && profile && !loading) {
      router.replace("/dashboard");
    }
  }, [firebaseUser, loading, profile, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitGoogle() {
    setMessage("");
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card grid" onSubmit={submit}>
        <div>
          <h1>Sultanabad Library Login</h1>
          <p className="muted">Sign in with Firebase Authentication.</p>
        </div>
        {!firebaseReady && <div className="notice">Firebase environment variables are missing.</div>}
        <label className="muted required-field">Email<input className="input" value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
        <label className="muted required-field">Password<input className="input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
        {message && <div className="notice">{message}</div>}
        <button className="button" type="submit" disabled={submitting}>
          <LogIn size={16} /> {submitting ? "Logging in..." : "Login"}
        </button>
        <button className="button secondary" type="button" onClick={submitGoogle} disabled={submitting}>
          <Chrome size={16} /> Continue with Google
        </button>
      </form>
      <SiteFooter />
    </main>
  );
}
