"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useAuth } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { listBooks } from "@/services/bookService";
import type { Book } from "@/types";
import { deactivateBook } from "@/services/bookService";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const { profile } = useAuth();

  useEffect(() => {
    listBooks(search || undefined).then(setBooks).catch(() => setBooks([]));
  }, [search]);

  function exportCsv() {
    const rows = books.map((book) => ({
      title: book.title,
      authors: book.authors.join(", "),
      category: book.category,
      isbn: book.isbn ?? "",
      publisher: book.publisher ?? "",
      publicationYear: book.publicationYear ?? "",
      status: book.isActive ? "active" : "removed"
    }));
    downloadCsv("books.csv", toCsv(rows));
  }

  async function handleDelete(book: Book) {
    if (!profile || !book.id) return;
    const confirmed = window.confirm(`Remove "${book.title}" from the catalog? This will mark it as inactive.`);
    if (!confirmed) return;
    await deactivateBook(book.id, profile.uid);
    setBooks((current) => current.filter((item) => item.id !== book.id));
  }

  return (
    <ProtectedRoute>
        <PageHeader
          title="Books"
          text="Search catalog titles and manage book metadata."
          action={
          <div className="page-header-actions">
            <Link className="button" href="/books/new">Add Book</Link>
            <button className="button secondary" type="button" onClick={exportCsv}>Export CSV</button>
          </div>
        }
      />
      <div className="toolbar">
        <input className="input" placeholder="Search title, author, ISBN, category" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="panel table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Authors</th><th>Category</th><th>ISBN</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{books.map((book) => <tr key={book.id}><td data-label="Title"><Link href={`/books/${book.id}`}>{book.title}</Link></td><td data-label="Authors">{book.authors?.join(", ")}</td><td data-label="Category">{book.category}</td><td data-label="ISBN">{book.isbn}</td><td data-label="Status"><StatusBadge status={book.isActive ? "available" : "removed"} /></td><td data-label="Actions"><div className="toolbar"><Link className="button secondary" href={`/books/${book.id}/edit`}>Edit</Link>{isStaff(profile?.role) ? <button className="button danger" type="button" onClick={() => handleDelete(book)} disabled={!book.id || !book.isActive}>Delete</button> : null}</div></td></tr>)}</tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
