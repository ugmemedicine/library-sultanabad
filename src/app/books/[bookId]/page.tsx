"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { deactivateBook, getBook } from "@/services/bookService";
import { listCopiesByBook } from "@/services/copyService";
import type { Book, BookCopy } from "@/types";

export default function BookDetailPage() {
  const params = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    setLoaded(false);
    Promise.all([getBook(params.bookId), listCopiesByBook(params.bookId)]).then(([bookResult, copiesResult]) => {
      setBook(bookResult);
      setCopies(copiesResult);
      setLoaded(true);
    });
  }, [params.bookId]);

  async function handleDelete() {
    if (!profile || !book?.id) return;
    const confirmed = window.confirm(`Remove "${book.title}" from the catalog? This will mark it as inactive.`);
    if (!confirmed) return;
    await deactivateBook(book.id, profile.uid);
    setBook(null);
  }

  return (
    <ProtectedRoute>
      {!loaded ? (
        <section className="panel">Loading book...</section>
      ) : book ? (
        <>
          <PageHeader title={book.title} text="Book metadata, physical copies, and current copy status." />
          <section className="panel">
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <Link className="button secondary" href={`/books/${params.bookId}/edit`}>Edit Book</Link>
              {isStaff(profile?.role) ? <button className="button danger" type="button" onClick={handleDelete} disabled={!book.id || book.isActive === false}>Delete Book</button> : null}
            </div>
            <div className="detail-grid two-col">
              <div className="detail-card"><strong>Authors</strong><div className="detail-value">{book.authors?.join(", ")}</div></div>
              <div className="detail-card"><strong>Category</strong><div className="detail-value">{book.category}</div></div>
              <div className="detail-card"><strong>ISBN</strong><div className="detail-value">{book.isbn || "Not set"}</div></div>
              <div className="detail-card"><strong>Status</strong><div className="detail-value">{book.isActive === false ? "Inactive" : "Active"}</div></div>
            </div>
          </section>
          <section className="panel table-wrap" style={{ marginTop: 18 }}>
            <table>
              <thead><tr><th>Accession</th><th>Location</th><th>Condition</th><th>Status</th><th>Issued to</th><th>Due</th><th>Actions</th></tr></thead>
              <tbody>{copies.map((copy) => <tr key={copy.id}><td data-label="Accession">{copy.accessionNumber}</td><td data-label="Location">{copy.location}</td><td data-label="Condition">{copy.condition}</td><td data-label="Status"><StatusBadge status={copy.status} /></td><td data-label="Issued to">{copy.currentIssuedToNameSnapshot ?? "-"}</td><td data-label="Due">{copy.currentDueAt ? copy.currentDueAt.toDate().toLocaleDateString() : "-"}</td><td data-label="Actions"><Link className="button secondary" href={`/copies/${copy.id}/edit`}>Edit</Link></td></tr>)}</tbody>
            </table>
          </section>
        </>
      ) : (
        <section className="panel">
          <h2>Book removed</h2>
          <p className="muted">This book has been removed from the catalog.</p>
          <Link className="button secondary" href="/books">Back to Books</Link>
        </section>
      )}
    </ProtectedRoute>
  );
}
