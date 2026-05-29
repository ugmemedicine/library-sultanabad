"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, firebaseReady } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
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
        <button className="button" type="submit"><LogIn size={16} /> Login</button>
      </form>
      <SiteFooter />
    </main>
  );
}
