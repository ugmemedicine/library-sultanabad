import type { Book, BookCopy, LibraryMember } from "@/types";

export function requireText(value: string | undefined, label: string) {
  if (!value?.trim()) throw new Error(`${label} is required.`);
}

export function validateBook(data: Pick<Book, "title" | "category" | "authors">) {
  requireText(data.title, "Title");
  requireText(data.category, "Category");
  if (!data.authors.length) throw new Error("At least one author is recommended for catalog quality.");
}

export function validateCopy(data: Pick<BookCopy, "bookId" | "accessionNumber" | "location">) {
  requireText(data.bookId, "Book");
  requireText(data.accessionNumber, "Accession number");
  requireText(data.location, "Location");
}

export function validateMember(data: Pick<LibraryMember, "displayName" | "email" | "address" | "phone">) {
  requireText(data.displayName, "Member name");
  requireText(data.email, "Email");
  requireText(data.address, "Address");
  requireText(data.phone, "Phone number");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error("Enter a valid email address.");
  if (!/^\d+$/.test(data.phone)) throw new Error("Phone number must contain numbers only.");
}
