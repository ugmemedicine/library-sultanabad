"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { CameraBarcodeScanner } from "@/components/CameraBarcodeScanner";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { StatusBadge } from "@/components/StatusBadge";
import { getBook } from "@/services/bookService";
import { lookupMember, searchMembers } from "@/services/memberService";
import { getSettings } from "@/services/settingsService";
import { getCopyByAccession } from "@/services/copyService";
import { issueBook } from "@/services/loanService";
import type { Book, BookCopy, LibraryMember } from "@/types";

export default function IssuePage() {
  const { profile } = useAuth();
  const [memberQuery, setMemberQuery] = useState("");
  const [accession, setAccession] = useState("");
  const [message, setMessage] = useState("");
  const [member, setMember] = useState<LibraryMember | null>(null);
  const [copy, setCopy] = useState<BookCopy | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [memberLookupLoading, setMemberLookupLoading] = useState(false);
  const [memberSuggestions, setMemberSuggestions] = useState<LibraryMember[]>([]);
  const [memberSuggestionsLoading, setMemberSuggestionsLoading] = useState(false);
  const [copyLookupLoading, setCopyLookupLoading] = useState(false);
  const [bookLookupLoading, setBookLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canIssue = Boolean(member?.id && accession.trim() && copy?.id && copy.status === "available" && member?.status === "active" && !submitting);

  useEffect(() => {
    const value = memberQuery.trim();
    if (!value) {
      setMember(null);
      setMemberSuggestions([]);
      return;
    }
    let active = true;
    setMemberLookupLoading(true);
    setMemberSuggestionsLoading(true);
    lookupMember(value)
      .then((result) => {
        if (!active) return;
        setMember(result);
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
    const value = accession.trim();
    if (!value) {
      setCopy(null);
      setBook(null);
      return;
    }
    setCopyLookupLoading(true);
    getCopyByAccession(value)
      .then((result) => setCopy(result))
      .finally(() => setCopyLookupLoading(false));
  }, [accession]);

  useEffect(() => {
    if (!copy?.bookId) {
      setBook(null);
      setBookLookupLoading(false);
      return;
    }
    let active = true;
    setBookLookupLoading(true);
    getBook(copy.bookId)
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
  }, [copy?.bookId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !canIssue || !copy?.id || !member?.id) return;
    setSubmitting(true);
    setMessage("");
    try {
      const settings = await getSettings();
      const loanId = await issueBook({ memberId: member.id, copyId: copy.id, issuedBy: profile.uid, defaultLoanDays: settings.defaultLoanDays });
      setMessage(`Issued successfully. Loan ID: ${loanId}`);
      setAccession("");
      setMemberQuery("");
      setCopy(null);
      setMember(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Issue failed.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Issue Book" text="Search a member by name or member code, then scan or enter the copy accession number." />
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
            <label className="required-field">Accession / Barcode<input autoFocus className="input" value={accession} onChange={(e) => setAccession(e.target.value)} placeholder="ACC-000001" /></label>
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
                  <div className="detail-card"><strong>Member Code</strong><div className="detail-value">{member.memberCode}</div></div>
                  <div className="detail-card"><strong>Status</strong><div className="detail-value"><StatusBadge status={member.status} /></div></div>
                </div>
              )}
            </section>
          ) : null}
          {accession.trim() ? (
            <section className="panel">
              {copyLookupLoading ? (
                <p className="muted">Checking copy status...</p>
              ) : !copy ? (
                <p className="muted">No copy found with this accession/barcode.</p>
              ) : (
                <div className="detail-grid">
                  <div className="detail-card"><strong>Accession</strong><div className="detail-value">{copy.accessionNumber}</div></div>
                  <div className="detail-card"><strong>Barcode</strong><div className="detail-value">{copy.barcode}</div></div>
                  <div className="detail-card"><strong>Location</strong><div className="detail-value">{copy.location}{copy.shelf ? ` / ${copy.shelf}` : ""}</div></div>
                  <div className="detail-card"><strong>Condition</strong><div className="detail-value">{copy.condition}</div></div>
                  <div className="detail-card"><strong>Status</strong><div className="detail-value"><StatusBadge status={copy.status} /></div></div>
                  <div className="detail-card"><strong>Current Borrower</strong><div className="detail-value">{copy.currentIssuedToNameSnapshot ?? "Not issued"}</div></div>
                  <div className="detail-card"><strong>Due Date</strong><div className="detail-value">{copy.currentDueAt ? formatDate(copy.currentDueAt) : "Not set"}</div></div>
                  <div className="detail-full">
                    <strong>Book Details</strong>
                    {bookLookupLoading ? (
                      <p className="muted">Loading book details...</p>
                    ) : book ? (
                      <div className="detail-grid" style={{ marginTop: 8 }}>
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
                  </div>
                </div>
              )}
            </section>
          ) : null}
          {message && <div className="notice">{message}</div>}
          <button className="button" disabled={!canIssue} type="submit">{submitting ? "Issuing..." : "Confirm Issue"}</button>
        </form>
        <CameraBarcodeScanner onDetected={setAccession} />
      </RoleGate>
    </ProtectedRoute>
  );
}
