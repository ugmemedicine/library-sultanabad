"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { getActiveLoansByMember, getLoanHistoryByMember } from "@/services/loanService";
import { deactivateMember, getMember } from "@/services/memberService";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import type { LibraryMember, Loan } from "@/types";

export default function MemberDetailPage() {
  const params = useParams<{ memberId: string }>();
  const [member, setMember] = useState<LibraryMember | null>(null);
  const [history, setHistory] = useState<Loan[]>([]);
  const { profile } = useAuth();
  useEffect(() => {
    getMember(params.memberId).then(setMember);
    Promise.all([getActiveLoansByMember(params.memberId), getLoanHistoryByMember(params.memberId)]).then(([, all]) => setHistory(all));
  }, [params.memberId]);

  async function handleDelete() {
    if (!profile || !member?.id) return;
    const confirmed = window.confirm(`Remove member ${member.displayName}? This will mark them as inactive.`);
    if (!confirmed) return;
    await deactivateMember(member.id);
    setMember(null);
  }

  return (
    <ProtectedRoute>
      {member ? (
        <>
          <PageHeader title={member.displayName} text="Profile, active loans, and borrowing history." />
          <section className="panel">
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <Link className="button secondary" href="/members">Back to Members</Link>
              <button className="button danger" type="button" onClick={handleDelete} disabled={!member.id}>Delete Member</button>
            </div>
            <div className="grid">
              <p><strong>Email:</strong> {member.email}</p>
              <p><strong>Member Code:</strong> {member.memberCode}</p>
              <p><strong>Address:</strong> {member.address}</p>
              <p><strong>Phone:</strong> {member.phone}</p>
              <StatusBadge status={member.status} />
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <h2>Member removed</h2>
          <p className="muted">This member is inactive and no longer shown in the active member list.</p>
          <Link className="button secondary" href="/members">Back to Members</Link>
        </section>
      )}
      <section className="panel table-wrap" style={{ marginTop: 18 }}>
        <table>
          <thead><tr><th>Book</th><th>Accession</th><th>Issued</th><th>Due</th><th>Status</th><th>Fine</th></tr></thead>
          <tbody>{history.map((loan) => <tr key={loan.id}><td data-label="Book">{loan.bookTitleSnapshot}</td><td data-label="Accession">{loan.accessionNumberSnapshot}</td><td data-label="Issued">{formatDate(loan.issuedAt)}</td><td data-label="Due">{formatDate(loan.dueAt)}</td><td data-label="Status"><StatusBadge status={loan.status} /></td><td data-label="Fine">{loan.fineAmount}</td></tr>)}</tbody>
        </table>
      </section>
    </ProtectedRoute>
  );
}
