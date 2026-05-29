import { SiteFooter } from "@/components/SiteFooter";

export default function UnauthorizedPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Access blocked</h1>
        <p className="muted">Your account is suspended, inactive, or missing permission for this workflow.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
