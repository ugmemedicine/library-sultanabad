"use client";

import { useAuth } from "@/lib/auth";
import { BookForm, type BookFormValue } from "@/components/BookForm";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { createBook } from "@/services/bookService";

export default function NewBookPage() {
  const { profile } = useAuth();
  async function save(value: BookFormValue) {
    if (!profile) throw new Error("Login required.");
    await createBook({
      title: value.title,
      authors: value.authors.split(",").map((item) => item.trim()).filter(Boolean),
      isbn: value.isbn,
      category: value.category,
      publisher: value.publisher,
      publicationYear: value.publicationYear ? Number(value.publicationYear) : undefined,
      description: value.description,
      subtitle: "",
      language: "English",
      coverImageUrl: ""
    }, profile.uid);
  }
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Add Book" text="Create a catalog title. Physical copies are added separately." />
        <BookForm onSubmit={save} />
      </RoleGate>
    </ProtectedRoute>
  );
}
