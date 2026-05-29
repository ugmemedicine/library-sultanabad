"use client";

import { useEffect, useState } from "react";
import type { Book } from "@/types";

export interface CopyFormValue {
  bookId: string;
  accessionNumber: string;
  location: string;
  shelf: string;
  condition: string;
}

const emptyValue: CopyFormValue = {
  bookId: "",
  accessionNumber: "",
  location: "Main Library",
  shelf: "",
  condition: "good"
};

export function CopyForm({
  onSubmit,
  initialValue,
  submitLabel = "Save Copy",
  books = [],
  generateAccessionNumber
}: {
  onSubmit: (value: CopyFormValue) => Promise<void>;
  initialValue?: CopyFormValue;
  submitLabel?: string;
  books?: Book[];
  generateAccessionNumber?: (bookId: string) => Promise<string>;
}) {
  const [value, setValue] = useState<CopyFormValue>(initialValue ?? emptyValue);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setValue(initialValue ?? emptyValue);
  }, [initialValue]);
  useEffect(() => {
    if (!generateAccessionNumber || !value.bookId) return;
    let active = true;
    setMessage("");
    generateAccessionNumber(value.bookId)
      .then((accessionNumber) => {
        if (!active) return;
        setValue((current) => (current.bookId === value.bookId ? { ...current, accessionNumber } : current));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [generateAccessionNumber, value.bookId]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onSubmit(value);
      setMessage("Copy saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save copy.");
    }
  }
  return (
    <form className="panel grid" onSubmit={submit}>
      <div className="form-grid">
        <label className="required-field">
          Book
          <select className="select" value={value.bookId} onChange={(e) => setValue({ ...value, bookId: e.target.value })}>
            <option value="">Select a book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} {book.isbn ? `(${book.isbn})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="required-field">Accession / Barcode<input className="input" readOnly={Boolean(generateAccessionNumber)} value={value.accessionNumber} onChange={(e) => setValue({ ...value, accessionNumber: e.target.value })} placeholder={generateAccessionNumber ? "Auto-generated from category" : "ACC-000001"} /></label>
        <label className="required-field">Location<input className="input" value={value.location} onChange={(e) => setValue({ ...value, location: e.target.value })} /></label>
        <label>Shelf<input className="input" value={value.shelf} onChange={(e) => setValue({ ...value, shelf: e.target.value })} /></label>
      </div>
      {message && <div className="notice">{message}</div>}
      <button className="button" type="submit">{submitLabel}</button>
    </form>
  );
}
