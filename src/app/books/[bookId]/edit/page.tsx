"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { BookForm, type BookFormValue } from "@/components/BookForm";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { getBook, updateBook } from "@/services/bookService";
import type { Book } from "@/types";

function mapBookToFormValue(book: Book): BookFormValue {
  return {
    title: book.title ?? "",
    authors: book.authors?.join(", ") ?? "",
    isbn: book.isbn ?? "",
    category: book.category ?? "",
    publisher: book.publisher ?? "",
    publicationYear: book.publicationYear ? String(book.publicationYear) : "",
    description: book.description ?? ""
  };
}

export default function EditBookPage() {
  const params = useParams<{ bookId: string }>();
  const { profile } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    getBook(params.bookId).then((result) => {
      setBook(result);
      setLoaded(true);
    });
  }, [params.bookId]);

  async function save(value: BookFormValue) {
    if (!profile) throw new Error("Login required.");
    await updateBook(params.bookId, {
      title: value.title,
      authors: value.authors.split(",").map((item) => item.trim()).filter(Boolean),
      isbn: value.isbn,
      category: value.category,
      publisher: value.publisher,
      publicationYear: value.publicationYear ? Number(value.publicationYear) : undefined,
      description: value.description
    }, profile.uid);
  }

  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Edit Book" text="Update catalog title details and metadata." />
        {!loaded ? (
          <section className="panel">Loading book...</section>
        ) : book ? (
          <BookForm onSubmit={save} initialValue={mapBookToFormValue(book)} submitLabel="Update Book" />
        ) : (
          <section className="panel">
            <h2>Book removed</h2>
            <p className="muted">This book is no longer active and cannot be edited.</p>
          </section>
        )}
      </RoleGate>
    </ProtectedRoute>
  );
}
