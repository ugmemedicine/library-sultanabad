"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { formatDate } from "@/lib/dates";
import { getActiveLoansByMember, returnBook } from "@/services/loanService";
import { lookupMember, searchMembers } from "@/services/memberService";
import { getSettings } from "@/services/settingsService";
import type { LibraryMember, Loan, ReturnCondition } from "@/types";

export default function ReturnPage() {
  const { profile } = useAuth();
  const [memberQuery, setMemberQuery] = useState("");
  const [member, setMember] = useState<LibraryMember | null>(null);
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [memberSuggestions, setMemberSuggestions] = useState<LibraryMember[]>([]);
  const [memberSuggestionsLoading, setMemberSuggestionsLoading] = useState(false);
  const [condition, setCondition] = useState<ReturnCondition>("normal");
  const [message, setMessage] = useState("");
  const [returningLoanId, setReturningLoanId] = useState<string | null>(null);

  async function loadActiveLoans(memberId: string) {
    const loans = await getActiveLoansByMember(memberId);
    setActiveLoans(loans);
    return loans;
  }

  useEffect(() => {
    const value = memberQuery.trim();
    if (!value) {
      setMember(null);
      setActiveLoans([]);
      setMemberSuggestions([]);
      return;
    }
    setMemberLookupLoading(true);
    setMemberSuggestionsLoading(true);
    lookupMember(value)
      .then(async (result) => {
        setMember(result);
        if (result?.id) {
          await loadActiveLoans(result.id);
        } else {
          setActiveLoans([]);
        }
      })
      .finally(() => setMemberLookupLoading(false));
    searchMembers(value)
      .then((results) => setMemberSuggestions(results.slice(0, 6)))
      .finally(() => setMemberSuggestionsLoading(false));
  }, [memberQuery]);

  async function handleReturnLoan(loan: Loan) {
    if (!profile) return;
    if (!loan.id) throw new Error("Loan record is missing an ID.");
    if (member?.id && loan.memberId !== member.id) {
      throw new Error("This book is issued to a different member.");
    }
    setReturningLoanId(loan.id ?? null);
    try {
      const settings = await getSettings();
      await returnBook({ loanId: loan.id, returnedBy: profile.uid, condition, finePerDay: settings.finePerDay });
      setMessage(`Returned ${loan.accessionNumberSnapshot}.`);
      if (member?.id) {
        await loadActiveLoans(member.id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Return failed.");
    } finally {
      setReturningLoanId(null);
    }
  }
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Return Book" text="Search a member by name or member code, then confirm return directly from the member's active loans." />
        <div className="panel grid">
          <div className="form-grid">
            <div className="member-autocomplete">
              <label className="required-field">Member Name / Code<input autoFocus className="input" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Search by name or code" /></label>
              {memberQuery.trim() ? (
                memberSuggestionsLoading ? (
                  <section className="panel member-suggestion-dropdown">
                    <p className="muted">Loading suggestions...</p>
                  </section>
                ) : memberSuggestions.length ? (
                  <div className="member-suggestion-list member-suggestion-dropdown">
                    {memberSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        className={`member-suggestion${suggestion.id === member?.id ? " active" : ""}`}
                        type="button"
                        onClick={() => setMemberQuery(suggestion.memberCode || suggestion.displayName)}
                      >
                        <strong>{suggestion.displayName}</strong>
                        <span>{suggestion.memberCode} · {suggestion.email}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <section className="panel member-suggestion-dropdown">
                    <p className="muted">No similar members found.</p>
                  </section>
                )
              ) : null}
            </div>
            <label className="required-field">Return Condition<select className="select" value={condition} onChange={(e) => setCondition(e.target.value as ReturnCondition)}><option value="normal">Normal</option><option value="damaged">Damaged</option><option value="lost">Lost</option></select></label>
          </div>
          {memberQuery.trim() ? (
            <section className="panel">
              {memberLookupLoading ? (
                <p className="muted">Searching member...</p>
              ) : !member ? (
                <p className="muted">No member found.</p>
              ) : (
                <div className="detail-grid two-col">
                  <div className="detail-card"><strong>Name</strong><div className="detail-value">{member.displayName}</div></div>
                  <div className="detail-card"><strong>Email</strong><div className="detail-value">{member.email}</div></div>
                  <div className="detail-card"><strong>Member Code</strong><div className="detail-value">{member.memberCode ?? memberQuery}</div></div>
                  <div className="detail-card"><strong>Status</strong><div className="detail-value"><StatusBadge status={member.status} /></div></div>
                  <div className="detail-card"><strong>Active Loans</strong><div className="detail-value">{activeLoans.length}</div></div>
                </div>
              )}
            </section>
          ) : null}
          {member?.id ? (
            <section className="panel">
              <h3>Issued Books</h3>
              {memberLookupLoading ? (
                <p className="muted">Loading active loans...</p>
              ) : activeLoans.length ? (
                <div className="detail-grid">
                  {activeLoans.map((loan) => (
                    <article className="detail-card compact-loan-card" key={loan.id}>
                      <div className="compact-loan-title">
                        <strong>{loan.bookTitleSnapshot}</strong>
                        <div className="compact-loan-authors">{loan.bookAuthorsSnapshot?.length ? loan.bookAuthorsSnapshot.join(", ") : "Authors not set"}</div>
                      </div>
                      <div className="compact-loan-meta">
                        <p>Accession: {loan.accessionNumberSnapshot}</p>
                        <p>Issued: {formatDate(loan.issuedAt)}</p>
                        <p>Due: {formatDate(loan.dueAt)}</p>
                        <p>Status: {loan.status}</p>
                      </div>
                      <button
                        className="button"
                        type="button"
                        onClick={() => {
                          handleReturnLoan(loan).catch((error) => {
                            setMessage(error instanceof Error ? error.message : "Return failed.");
                          });
                        }}
                        disabled={returningLoanId === loan.id}
                        style={{ marginTop: 12 }}
                      >
                        {returningLoanId === loan.id ? "Returning..." : "Confirm Return"}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">No active issued books for this member.</p>
              )}
            </section>
          ) : null}
          {message && <div className="notice">{message}</div>}
        </div>
      </RoleGate>
    </ProtectedRoute>
  );
}
