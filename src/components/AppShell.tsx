"use client";

import { BookOpen, Home, LogOut, Menu, RefreshCcw, RotateCcw, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { canAccess, navItems } from "@/lib/routes";
import { roleLabel } from "@/lib/roles";
import { LoadingState } from "@/components/LoadingState";
import { SiteFooter } from "@/components/SiteFooter";

const icons = [Home, BookOpen, BookOpen, Users, Menu, RotateCcw, RefreshCcw, BookOpen, Settings];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [bootstrapCompleted, setBootstrapCompleted] = useState(false);
  const [bootstrappedProfile, setBootstrappedProfile] = useState<ReturnType<typeof useAuth>["profile"]>(null);
  const { profile, loading, logout, firebaseReady, firebaseUser, testMode, ensureProfile } = useAuth();

  useEffect(() => {
    if (loading || testMode || !firebaseUser || profile || bootstrapCompleted) return;
    let cancelled = false;
    (async () => {
      const ensuredProfile = await ensureProfile();
      if (cancelled) return;
      setBootstrappedProfile(ensuredProfile);
      setBootstrapCompleted(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapCompleted, ensureProfile, firebaseUser, loading, profile, testMode]);

  const effectiveProfile = profile ?? bootstrappedProfile;

  if (loading || (firebaseUser && !effectiveProfile && !bootstrapCompleted)) return <main className="content"><LoadingState /></main>;
  if (!firebaseReady && !testMode) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Firebase configuration required</h1>
          <p className="muted">Copy `.env.local.example` to `.env.local`, add your Firebase web config, then restart the dev server.</p>
        </section>
      </main>
    );
  }
  if (!firebaseUser) {
    router.replace("/login");
    return null;
  }
  if (firebaseUser && !effectiveProfile && bootstrapCompleted) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Profile missing</h1>
          <p className="muted">Your Firebase Auth account exists, but there is no matching Firestore profile in `users/{firebaseUser.uid}`.</p>
        </section>
      </main>
    );
  }
  const resolvedProfile = effectiveProfile;
  if (!resolvedProfile) return null;
  if (resolvedProfile.status !== "active") {
    router.replace("/unauthorized");
    return null;
  }

  const userFullName = firebaseUser?.displayName?.trim() || resolvedProfile.displayName || resolvedProfile.email;
  const visibleItems = navItems.filter((item) => canAccess(resolvedProfile.role, item.roles));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="brand">Sultanabad Library</div>
        <nav className="nav">
          {visibleItems.map((item, index) => {
            const Icon = icons[index] ?? BookOpen;
            return (
              <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href} onClick={() => setNavOpen(false)}>
                <span className="nav-item">
                  <Icon size={16} /> {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="main">
        <header className="topbar">
          <button aria-label="Toggle navigation" className="button secondary nav-toggle" onClick={() => setNavOpen((value) => !value)} type="button">
            <Menu size={16} />
          </button>
          <div className="topbar-user">
            <strong>{userFullName}</strong>
            <div className="muted">{roleLabel(resolvedProfile.role)}</div>
          </div>
          <button className="button secondary" onClick={logout} type="button">
            <LogOut size={16} /> Logout
          </button>
        </header>
        <main className="content">{children}</main>
        <SiteFooter />
      </section>
    </div>
  );
}
