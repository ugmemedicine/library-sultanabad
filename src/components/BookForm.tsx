"use client";

import { useEffect, useState } from "react";

export interface BookFormValue {
  title: string;
  authors: string;
  isbn: string;
  category: string;
  publisher: string;
  publicationYear: string;
  description: string;
}

const emptyValue: BookFormValue = {
  title: "",
  authors: "",
  isbn: "",
  category: "",
  publisher: "",
  publicationYear: "",
  description: ""
};

const categorySuggestions = [
  "AC",
  "BIO",
  "CS",
  "FICTION",
  "HIS",
  "LAW",
  "MATH",
  "SCI",
  "TECH"
];

export function BookForm({
  onSubmit,
  initialValue,
  submitLabel = "Save Book"
}: {
  onSubmit: (value: BookFormValue) => Promise<void>;
  initialValue?: BookFormValue;
  submitLabel?: string;
}) {
  const [value, setValue] = useState<BookFormValue>(initialValue ?? emptyValue);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setValue(initialValue ?? emptyValue);
  }, [initialValue]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await onSubmit(value);
      setMessage("Book saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save book.");
    }
  }
  return (
    <form className="panel grid" onSubmit={submit}>
      <datalist id="book-category-codes">
        {categorySuggestions.map((code) => (
          <option key={code} value={code} />
        ))}
      </datalist>
      <div className="form-grid">
        <label className="required-field">Title<input className="input" value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} /></label>
        <label className="required-field">Authors<input className="input" value={value.authors} onChange={(e) => setValue({ ...value, authors: e.target.value })} placeholder="Comma separated" /></label>
        <label>ISBN<input className="input" value={value.isbn} onChange={(e) => setValue({ ...value, isbn: e.target.value })} /></label>
        <label className="required-field">
          Category Code
          <input
            className="input"
            list="book-category-codes"
            maxLength={16}
            placeholder="AC"
            value={value.category}
            onChange={(e) => setValue({ ...value, category: e.target.value.toUpperCase().trimStart() })}
          />
        </label>
        <label>Publisher<input className="input" value={value.publisher} onChange={(e) => setValue({ ...value, publisher: e.target.value })} /></label>
        <label>Publication Year<input className="input" value={value.publicationYear} onChange={(e) => setValue({ ...value, publicationYear: e.target.value })} /></label>
      </div>
      <label className="muted">Description<textarea className="textarea" value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} /></label>
      {message && <div className="notice">{message}</div>}
      <button className="button" type="submit">{submitLabel}</button>
    </form>
  );
}
