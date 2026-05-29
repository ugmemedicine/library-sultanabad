"use client";

import { Timestamp, collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Loan, ReportFilters } from "@/types";

const loans = collection(db, "loans");

function normalizeDate(value?: Date | Timestamp | null) {
  if (!value) return null;
  return value instanceof Timestamp ? value.toDate() : value;
}

function applyReportFilters(items: Loan[], filters: ReportFilters = {}, dateField: "issuedAt" | "dueAt" | "returnedAt" = "issuedAt") {
  const queryText = filters.query?.trim().toLowerCase() ?? "";
  const from = filters.from ? new Date(filters.from.getFullYear(), filters.from.getMonth(), filters.from.getDate()) : null;
  const to = filters.to ? new Date(filters.to.getFullYear(), filters.to.getMonth(), filters.to.getDate(), 23, 59, 59, 999) : null;

  return items.filter((loan) => {
    if (filters.status && loan.status !== filters.status) return false;
    if (filters.memberId && loan.memberId !== filters.memberId) return false;
    if (filters.bookId && loan.bookId !== filters.bookId) return false;

    if (queryText) {
      const haystack = `${loan.bookTitleSnapshot} ${loan.memberNameSnapshot} ${loan.accessionNumberSnapshot}`.toLowerCase();
      if (!haystack.includes(queryText)) return false;
    }

    if (from || to) {
      const dateValue = normalizeDate(loan[dateField]);
      if (!dateValue) return false;
      if (from && dateValue < from) return false;
      if (to && dateValue > to) return false;
    }

    return true;
  });
}

export async function getIssuedReport(filters: ReportFilters = {}) {
  const snap = await getDocs(query(loans, where("status", "in", filters.status ? [filters.status] : ["issued", "overdue"]), limit(100)));
  return applyReportFilters(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Loan), filters, "issuedAt");
}

export async function getOverdueReport(filters: ReportFilters = {}) {
  const { getOverdueLoans } = await import("@/services/loanService");
  const data = await getOverdueLoans();
  return applyReportFilters(data, filters, "dueAt");
}

export async function getReturnedReport(filters: ReportFilters = {}) {
  const snap = await getDocs(query(loans, where("status", "==", "returned"), limit(100)));
  return applyReportFilters(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Loan), filters, "returnedAt");
}

export async function getFinesReport() {
  const snap = await getDocs(query(loans, where("fineAmount", ">", 0), limit(100)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Loan);
}

export async function getMostBorrowedBooks() {
  const snap = await getDocs(query(loans, limit(500)));
  const counts = new Map<string, { title: string; count: number }>();
  snap.docs.forEach((item) => {
    const loan = item.data() as Loan;
    const current = counts.get(loan.bookId) ?? { title: loan.bookTitleSnapshot, count: 0 };
    counts.set(loan.bookId, { ...current, count: current.count + 1 });
  });
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export async function getMemberHistoryReport(filters: ReportFilters = {}) {
  const snap = await getDocs(query(loans, limit(300)));
  return applyReportFilters(snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Loan), filters, "issuedAt");
}
