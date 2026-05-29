"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BarcodeSvg } from "@/components/BarcodeSvg";
import { useAuth } from "@/lib/auth";
import { downloadCsv, toCsv } from "@/lib/csv";
import { CopyForm } from "@/components/CopyForm";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { StatusBadge } from "@/components/StatusBadge";
import { listBooks } from "@/services/bookService";
import { createCopyWithGeneratedAccession, deactivateCopy, generateAccessionNumberForBook, listCopies } from "@/services/copyService";
import type { Book, BookCopy } from "@/types";

export default function CopiesPage() {
  const { profile } = useAuth();

  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [labelPreset, setLabelPreset] = useState("50x25");
  const [customWidthMm, setCustomWidthMm] = useState("50");
  const [customHeightMm, setCustomHeightMm] = useState("25");
  const [refreshTick, setRefreshTick] = useState(0);
  const [books, setBooks] = useState<Book[]>([]);
  const booksById = useMemo(() => new Map(books.map((book) => [book.id, book] as const)), [books]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listCopies()
      .then((items) => {
        if (active) setCopies(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshTick]);

  useEffect(() => {
    listBooks().then(setBooks).catch(() => setBooks([]));
  }, [refreshTick]);

  const filteredCopies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return copies;
    return copies.filter((copy) =>
      [
        copy.accessionNumber,
        copy.barcode,
        copy.location,
        copy.shelf ?? "",
        booksById.get(copy.bookId)?.title ?? "",
        booksById.get(copy.bookId)?.authors.join(", ") ?? "",
        String(booksById.get(copy.bookId)?.publicationYear ?? "")
      ].some((item) => item.toLowerCase().includes(query))
    );
  }, [booksById, copies, search]);

  function exportCsv() {
    const rows = filteredCopies.map((copy) => ({
      accessionNumber: copy.accessionNumber,
      barcode: copy.barcode,
      bookTitle: booksById.get(copy.bookId)?.title ?? "",
      authors: booksById.get(copy.bookId)?.authors.join(", ") ?? "",
      publishedYear: booksById.get(copy.bookId)?.publicationYear ?? "",
      status: copy.status,
      condition: copy.condition
    }));
    downloadCsv("copies-barcodes.csv", toCsv(rows));
  }

  function getBookForCopy(copy: BookCopy) {
    return booksById.get(copy.bookId);
  }

  async function handleDelete(copy: BookCopy) {
    if (!profile || !copy.id) return;
    const confirmed = window.confirm(`Remove copy ${copy.accessionNumber}? This will mark it as removed.`);
    if (!confirmed) return;
    await deactivateCopy(copy.id, profile.uid);
    setCopies((current) => current.filter((item) => item.id !== copy.id));
  }

  const customWidth = Math.max(20, Number(customWidthMm) || 50);
  const customHeight = Math.max(10, Number(customHeightMm) || 25);
  const customStyle = labelPreset === "custom"
    ? ({
      ["--label-width" as string]: `${customWidth}mm`,
      ["--label-height" as string]: `${customHeight}mm`
    } as CSSProperties)
    : undefined;

  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader
          title="Copies"
          text="Add and manage physical book copies. Use accession numbers as the barcode workflow."
          action={
            <div className="page-header-actions">
              <button className="button secondary" onClick={exportCsv} type="button">Export CSV</button>
              <button className="button secondary" onClick={() => window.print()} type="button">Print Labels</button>
            </div>
          }
        />
        <CopyForm
          books={books}
          generateAccessionNumber={generateAccessionNumberForBook}
          onSubmit={async (value) => {
            if (!profile) throw new Error("Login required.");
            await createCopyWithGeneratedAccession({
              bookId: value.bookId,
              location: value.location,
              shelf: value.shelf,
              status: "available",
              condition: "good",
              notes: ""
            }, profile.uid);
            setRefreshTick((value) => value + 1);
          }}
        />
        <section className="panel">
          <div className="toolbar">
            <input
              className="input"
              placeholder="Search accession, barcode, book ID, location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select className="select" value={labelPreset} onChange={(event) => setLabelPreset(event.target.value)}>
              <option value="50x25">Label 50 x 25 mm</option>
              <option value="70x30">Label 70 x 30 mm</option>
              <option value="90x35">Label 90 x 35 mm</option>
              <option value="custom">Custom (mm)</option>
            </select>
            {labelPreset === "custom" ? (
              <>
                <input
                  className="input"
                  placeholder="Width mm"
                  type="number"
                  min={20}
                  value={customWidthMm}
                  onChange={(event) => setCustomWidthMm(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Height mm"
                  type="number"
                  min={10}
                  value={customHeightMm}
                  onChange={(event) => setCustomHeightMm(event.target.value)}
                />
              </>
            ) : null}
            <button className="button secondary" onClick={() => setRefreshTick((value) => value + 1)} type="button">Refresh</button>
          </div>
          {loading ? (
            <LoadingState label="Loading copies" />
          ) : !filteredCopies.length ? (
            <EmptyState title="No copies found" text="Add copies or adjust your search." />
          ) : (
            <>
              <section className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Accession</th>
                      <th>Barcode</th>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Published-Year</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCopies.map((copy) => (
                      <tr key={copy.id}>
                        <td data-label="Accession">{copy.accessionNumber}</td>
                        <td data-label="Barcode">{copy.barcode}</td>
                        <td data-label="Book Title">{getBookForCopy(copy)?.title ?? copy.bookId}</td>
                        <td data-label="Author">{getBookForCopy(copy)?.authors.join(", ") ?? "-"}</td>
                        <td data-label="Published-Year">{getBookForCopy(copy)?.publicationYear ?? "-"}</td>
                        <td data-label="Status"><StatusBadge status={copy.status} /></td>
                        <td data-label="Actions">
                          <div className="toolbar">
                            <Link className="button secondary" href={`/copies/${copy.id}/edit`}>Edit</Link>
                            <button
                              className="button danger"
                              disabled={!copy.id || copy.status === "issued"}
                              type="button"
                              onClick={() => handleDelete(copy)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <section className={`label-sheet no-screen label-${labelPreset}`} style={customStyle}>
                {filteredCopies.map((copy) => (
                  <article className="copy-label" key={`label-${copy.id}`}>
                    <div className="copy-label-title">{copy.accessionNumber}</div>
                    <BarcodeSvg value={copy.barcode || copy.accessionNumber} />
                    <div className="copy-label-meta">
                      <div className="copy-label-book">{getBookForCopy(copy)?.title ?? copy.bookId}</div>
                      <div className="copy-label-sub">{getBookForCopy(copy)?.authors.join(", ") ?? ""}</div>
                      <div className="copy-label-sub">{getBookForCopy(copy)?.publicationYear ?? ""}</div>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </section>
      </RoleGate>
    </ProtectedRoute>
  );
}
