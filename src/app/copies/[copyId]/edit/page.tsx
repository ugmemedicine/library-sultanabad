"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { CopyForm, type CopyFormValue } from "@/components/CopyForm";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { getBook, listBooks } from "@/services/bookService";
import { deactivateCopy, getCopy, updateCopy } from "@/services/copyService";
import type { Book, BookCopy } from "@/types";

function mapCopyToFormValue(copy: BookCopy): CopyFormValue {
  return {
    bookId: copy.bookId ?? "",
    accessionNumber: copy.accessionNumber ?? "",
    location: copy.location ?? "Main Library",
    shelf: copy.shelf ?? "",
    condition: copy.condition ?? "good"
  };
}

export default function EditCopyPage() {
  const params = useParams<{ copyId: string }>();
  const { profile } = useAuth();
  const [copy, setCopy] = useState<BookCopy | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    getCopy(params.copyId).then(setCopy);
  }, [params.copyId]);

  useEffect(() => {
    let active = true;
    listBooks().then(async (items) => {
      if (!active) return;
      if (copy?.bookId && !items.some((item) => item.id === copy.bookId)) {
        const currentBook = await getBook(copy.bookId);
        setBooks(currentBook ? [currentBook, ...items] : items);
        return;
      }
      setBooks(items);
    }).catch(() => setBooks([]));
    return () => {
      active = false;
    };
  }, [copy?.bookId]);

  async function save(value: CopyFormValue) {
    if (!profile) throw new Error("Login required.");
    await updateCopy(params.copyId, {
      bookId: value.bookId,
      accessionNumber: value.accessionNumber,
      barcode: value.accessionNumber,
      location: value.location,
      shelf: value.shelf,
      condition: value.condition as BookCopy["condition"]
    }, profile.uid);
  }

  async function handleDelete() {
    if (!profile || !copy?.id) return;
    const confirmed = window.confirm(`Remove copy ${copy.accessionNumber}? This will mark it as removed.`);
    if (!confirmed) return;
    await deactivateCopy(copy.id, profile.uid);
    setCopy(null);
  }

  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Edit Copy" text="Update copy metadata and barcode settings." />
        {copy ? (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button className="button danger" type="button" onClick={handleDelete} disabled={copy.status === "issued"}>
                Delete Copy
              </button>
            </div>
            <CopyForm books={books} onSubmit={save} initialValue={mapCopyToFormValue(copy)} submitLabel="Update Copy" />
          </>
        ) : (
          <section className="panel">Loading copy...</section>
        )}
      </RoleGate>
    </ProtectedRoute>
  );
}
