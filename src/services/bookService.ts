"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildKeywords, normalizeIsbn } from "@/lib/search";
import { validateBook } from "@/lib/validators";
import type { Book } from "@/types";

const books = collection(db, "books");

function normalizeCategoryCode(category: string) {
  return category.trim().toUpperCase();
}

export async function createBook(data: Omit<Book, "id" | "createdAt" | "updatedAt" | "keywords" | "isActive">, uid: string) {
  validateBook(data);
  const isbn = normalizeIsbn(data.isbn);
  const category = normalizeCategoryCode(data.category);
  const payload = {
    ...data,
    category,
    isbn,
    keywords: buildKeywords([data.title, data.subtitle, category, isbn, ...data.authors]),
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid
  };
  return addDoc(books, payload);
}

export async function updateBook(bookId: string, data: Partial<Book>, uid: string) {
  const category = data.category ? normalizeCategoryCode(data.category) : data.category;
  await updateDoc(doc(db, "books", bookId), {
    ...data,
    category,
    isbn: data.isbn ? normalizeIsbn(data.isbn) : data.isbn,
    keywords: buildKeywords([data.title, data.subtitle, category ?? data.category, data.isbn, ...(data.authors ?? [])]),
    updatedAt: serverTimestamp(),
    updatedBy: uid
  });
}

export async function getBook(bookId: string) {
  const snap = await getDoc(doc(db, "books", bookId));
  if (!snap.exists()) return null;
  const book = { id: snap.id, ...snap.data() } as Book;
  return book.isActive === false ? null : book;
}

export async function listBooks(search?: string) {
  const q = search
    ? query(books, where("keywords", "array-contains", search.toLowerCase()), limit(50))
    : query(books, orderBy("title"), limit(50));
  const snap = await getDocs(q);
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as Book)
    .filter((book) => book.isActive !== false);
}

export async function listActiveBooks() {
  const snap = await getDocs(query(books, orderBy("title")));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as Book)
    .filter((book) => book.isActive !== false);
}

export async function deactivateBook(bookId: string, uid: string) {
  await updateDoc(doc(db, "books", bookId), {
    isActive: false,
    updatedAt: serverTimestamp(),
    updatedBy: uid
  });
}
