"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Reports" text="Filter circulation reports and export results as CSV from each report view." />
        <section className="grid cards">
          <Link className="card" href="/reports/issued"><strong>Issued books</strong><p className="muted">Current active loans.</p></Link>
          <Link className="card" href="/reports/overdue"><strong>Overdue books</strong><p className="muted">Live overdue calculation.</p></Link>
          <Link className="card" href="/reports/returned"><strong>Returned books</strong><p className="muted">Closed loan history.</p></Link>
          <Link className="card" href="/reports/member-history"><strong>Member history</strong><p className="muted">Cross-member loan history report.</p></Link>
        </section>
      </RoleGate>
    </ProtectedRoute>
  );
}
