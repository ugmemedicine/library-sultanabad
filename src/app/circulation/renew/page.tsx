"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { getBook } from "@/services/bookService";
import { renewLoan } from "@/services/loanService";
import { getSettings } from "@/services/settingsService";
import { getActiveLoansByMember } from "@/services/loanService";
import { lookupMember, searchMembers } from "@/services/memberService";
import { StatusBadge } from "@/components/StatusBadge";
import type { Book, LibraryMember, Loan } from "@/types";

export default function RenewPage() {
  const { profile } = useAuth();
  const [memberQuery, setMemberQuery] = useState("");
  const [member, setMember] = useState<LibraryMember | null>(null);
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [memberSuggestions, setMemberSuggestions] = useState<LibraryMember[]>([]);
  const [memberSuggestionsLoading, setMemberSuggestionsLoading] = useState(false);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [loanId, setLoanId] = useState("");
  const [book, setBook] = useState<Book | null>(null);
  const [bookLookupLoading, setBookLookupLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const value = memberQuery.trim();
    if (!value) {
      setMember(null);
      setActiveLoans([]);
      setLoanId("");
      setMemberSuggestions([]);
      return;
    }
    let active = true;
    setMemberLookupLoading(true);
    setMemberSuggestionsLoading(true);
    lookupMember(value)
      .then(async (result) => {
        if (!active) return;
        setMember(result);
        if (result?.id) {
          const loans = await getActiveLoansByMember(result.id);
          if (!active) return;
          setActiveLoans(loans);
          setLoanId(loans[0]?.id ?? "");
        } else {
          setActiveLoans([]);
          setLoanId("");
        }
      })
      .finally(() => {
        if (active) setMemberLookupLoading(false);
      });
    searchMembers(value)
      .then((results) => {
        if (!active) return;
        setMemberSuggestions(results.slice(0, 6));
      })
      .finally(() => {
        if (active) setMemberSuggestionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [memberQuery]);

  useEffect(() => {
    const selectedLoan = activeLoans.find((loan) => loan.id === loanId);
    if (!selectedLoan?.bookId) {
      setBook(null);
      setBookLookupLoading(false);
      return;
    }
    let active = true;
    setBookLookupLoading(true);
    getBook(selectedLoan.bookId)
      .then((result) => {
        if (!active) return;
        setBook(result);
      })
      .finally(() => {
        if (active) setBookLookupLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeLoans, loanId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    try {
      if (!loanId) throw new Error("Select an active loan for this member.");
      const settings = await getSettings();
      await renewLoan({ loanId, renewedBy: profile.uid, maxRenewals: settings.maxRenewals, defaultLoanDays: settings.defaultLoanDays });
      setMessage("Loan renewed.");
      setMemberQuery("");
      setMember(null);
      setActiveLoans([]);
      setLoanId("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Renewal failed.");
    }
  }
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Renew Loan" text="Search a member by name or member code, then choose one active loan to renew." />
        <form className="panel grid" onSubmit={submit}>
          <div className="form-grid">
            <div className="member-autocomplete">
              <label className="required-field">Member Name / Code<input className="input" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Search by name or code" /></label>
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
            <label className="required-field">Active Loan<select className="select" value={loanId} onChange={(e) => setLoanId(e.target.value)} disabled={!activeLoans.length}>
              <option value="">{activeLoans.length ? "Select a loan" : "No active loans"}</option>
              {activeLoans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.accessionNumberSnapshot} - {loan.bookTitleSnapshot}
                </option>
              ))}
              </select></label>
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
          {message && <div className="notice">{message}</div>}
          {loanId ? (
            <section className="panel">
              {bookLookupLoading ? (
                <p className="muted">Loading book details...</p>
              ) : book ? (
                <div className="detail-grid">
                  <div className="detail-card"><strong>Title</strong><div className="detail-value">{book.title}</div></div>
                  <div className="detail-card"><strong>Authors</strong><div className="detail-value">{book.authors.join(", ")}</div></div>
                  <div className="detail-card"><strong>Category</strong><div className="detail-value">{book.category}</div></div>
                  <div className="detail-card"><strong>ISBN</strong><div className="detail-value">{book.isbn || "Not set"}</div></div>
                  <div className="detail-card"><strong>Publisher</strong><div className="detail-value">{book.publisher || "Not set"}</div></div>
                  <div className="detail-card"><strong>Publication Year</strong><div className="detail-value">{book.publicationYear || "Not set"}</div></div>
                  <div className="detail-card detail-full"><strong>Description</strong><div className="detail-value">{book.description || "Not set"}</div></div>
                </div>
              ) : (
                <p className="muted">Book details unavailable or book removed.</p>
              )}
            </section>
          ) : null}
          <button className="button" type="submit">Renew</button>
        </form>
      </RoleGate>
    </ProtectedRoute>
  );
}
