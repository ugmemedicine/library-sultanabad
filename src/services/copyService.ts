"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validateCopy } from "@/lib/validators";
import type { Book, BookCopy, CopyStatus } from "@/types";

const copies = collection(db, "bookCopies");
const books = collection(db, "books");

function normalizeAccessionPrefix(category: string) {
  const prefix = category.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return prefix || "ACC";
}

function parseAccessionNumber(accessionNumber: string, prefix: string) {
  const match = new RegExp(`^${prefix}-(\\d{3,})$`).exec(accessionNumber.trim().toUpperCase());
  return match ? Number(match[1]) : null;
}

export async function generateAccessionNumberForBook(bookId: string) {
  const [bookSnap, booksSnap, copiesSnap] = await Promise.all([getDoc(doc(db, "books", bookId)), getDocs(books), getDocs(copies)]);
  if (!bookSnap.exists()) throw new Error("Book was not found.");

  const selectedBook = { id: bookSnap.id, ...bookSnap.data() } as Book;
  const prefix = normalizeAccessionPrefix(selectedBook.category);
  const targetCategory = selectedBook.category.trim().toLowerCase();
  const booksById = new Map(booksSnap.docs.map((item) => [item.id, item.data() as Book]));

  const highest = copiesSnap.docs.reduce((max, item) => {
    const copy = { id: item.id, ...item.data() } as BookCopy;
    const relatedBook = booksById.get(copy.bookId);
    if (!relatedBook || relatedBook.category.trim().toLowerCase() !== targetCategory) return max;
    const value = parseAccessionNumber(copy.accessionNumber, prefix);
    return value && value > max ? value : max;
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

export async function createCopy(data: Omit<BookCopy, "id" | "createdAt" | "updatedAt">, uid: string) {
  validateCopy(data);
  const existing = await getCopyByAccession(data.accessionNumber);
  if (existing) throw new Error("Accession number already exists.");
  return addDoc(copies, {
    ...data,
    barcode: data.barcode || data.accessionNumber,
    status: data.status || "available",
    currentLoanId: null,
    currentIssuedToMemberId: null,
    currentIssuedToNameSnapshot: null,
    currentIssuedAt: null,
    currentDueAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid
  });
}

export async function updateCopy(copyId: string, data: Partial<BookCopy>, uid: string) {
  await updateDoc(doc(db, "bookCopies", copyId), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: uid
  });
}

export async function getCopy(copyId: string) {
  const snap = await getDoc(doc(db, "bookCopies", copyId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BookCopy) : null;
}

export async function getCopyByAccession(accessionNumber: string) {
  const snap = await getDocs(query(copies, where("accessionNumber", "==", accessionNumber.trim()), limit(1)));
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as BookCopy);
}

export async function listCopiesByBook(bookId: string) {
  const snap = await getDocs(query(copies, where("bookId", "==", bookId), limit(100)));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as BookCopy)
    .filter((copy) => copy.status !== "removed");
}

export async function listCopies() {
  const snap = await getDocs(query(copies, limit(300)));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as BookCopy)
    .filter((copy) => copy.status !== "removed");
}

export async function listAvailableCopies(bookId: string) {
  const snap = await getDocs(query(copies, where("bookId", "==", bookId), where("status", "==", "available"), limit(100)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as BookCopy);
}

export async function setCopyStatus(copyId: string, status: CopyStatus, uid: string) {
  await updateDoc(doc(db, "bookCopies", copyId), { status, updatedAt: serverTimestamp(), updatedBy: uid });
}

export async function deactivateCopy(copyId: string, uid: string) {
  await updateDoc(doc(db, "bookCopies", copyId), {
    status: "removed",
    updatedAt: serverTimestamp(),
    updatedBy: uid
  });
}

export async function createCopyWithGeneratedAccession(data: Omit<BookCopy, "id" | "createdAt" | "updatedAt" | "accessionNumber" | "barcode">, uid: string) {
  const accessionNumber = await generateAccessionNumberForBook(data.bookId);
  return createCopy({ ...data, accessionNumber, barcode: accessionNumber }, uid);
}
