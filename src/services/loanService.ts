"use client";

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where
} from "firebase/firestore";
import { addDays } from "@/lib/dates";
import { calculateFine } from "@/lib/fines";
import { db } from "@/lib/firebase";
import type { Book, BookCopy, LibraryMember, Loan, ReturnCondition } from "@/types";

const loans = collection(db, "loans");

export async function issueBook(params: { memberId: string; copyId: string; dueAt?: Date; issuedBy: string; defaultLoanDays: number }) {
  const loanRef = doc(loans);
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "members", params.memberId);
    const copyRef = doc(db, "bookCopies", params.copyId);
    const memberSnap = await transaction.get(memberRef);
    const copySnap = await transaction.get(copyRef);

    if (!memberSnap.exists()) throw new Error("Member was not found.");
    if (!copySnap.exists()) throw new Error("Copy was not found.");

    const member = { id: memberSnap.id, ...memberSnap.data() } as LibraryMember;
    const copy = { id: copySnap.id, ...copySnap.data() } as BookCopy;
    if (member.status !== "active") throw new Error("Suspended or inactive members cannot borrow.");
    if (copy.status !== "available") throw new Error(`Copy is not available. Current status: ${copy.status}.`);

    const bookSnap = await transaction.get(doc(db, "books", copy.bookId));
    if (!bookSnap.exists()) throw new Error("Book title was not found.");
    const book = { id: bookSnap.id, ...bookSnap.data() } as Book;
    const dueDate = params.dueAt ?? addDays(new Date(), params.defaultLoanDays);

    transaction.set(loanRef, {
      memberId: member.id,
      memberNameSnapshot: member.displayName,
      memberEmailSnapshot: member.email,
      bookId: copy.bookId,
      bookTitleSnapshot: book.title,
      bookAuthorsSnapshot: book.authors,
      copyId: copy.id,
      accessionNumberSnapshot: copy.accessionNumber,
      issuedAt: serverTimestamp(),
      dueAt: Timestamp.fromDate(dueDate),
      returnedAt: null,
      status: "issued",
      issuedBy: params.issuedBy,
      returnedBy: null,
      renewedCount: 0,
      fineAmount: 0,
      notes: ""
    });

    transaction.update(copyRef, {
      status: "issued",
      currentLoanId: loanRef.id,
      currentIssuedToMemberId: member.id,
      currentIssuedToNameSnapshot: member.displayName,
      currentIssuedAt: serverTimestamp(),
      currentDueAt: Timestamp.fromDate(dueDate),
      updatedAt: serverTimestamp(),
      updatedBy: params.issuedBy
    });

    transaction.set(doc(collection(db, "auditLogs")), {
      actorUid: params.issuedBy,
      actorRole: "staff",
      action: "ISSUE_BOOK",
      entityType: "loan",
      entityId: loanRef.id,
      message: `Issued ${copy.accessionNumber} to ${member.displayName}`,
      createdAt: serverTimestamp()
    });
  });
  return loanRef.id;
}

export async function returnBook(params: { loanId: string; returnedBy: string; condition: ReturnCondition; finePerDay: number }) {
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", params.loanId);
    const loanSnap = await transaction.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Active loan was not found.");
    const loan = { id: loanSnap.id, ...loanSnap.data() } as Loan;
    if (loan.returnedAt || !["issued", "overdue"].includes(loan.status)) throw new Error("This loan is not active.");

    const copyRef = doc(db, "bookCopies", loan.copyId);
    const copySnap = await transaction.get(copyRef);
    if (!copySnap.exists()) throw new Error("Copy was not found.");
    const copy = copySnap.data() as BookCopy;
    if (copy.currentLoanId !== loan.id) throw new Error("Copy status does not match the selected loan.");

    const nextCopyStatus = params.condition === "normal" ? "available" : params.condition;
    const fineAmount = calculateFine(loan.dueAt, params.finePerDay);
    transaction.update(loanRef, {
      returnedAt: serverTimestamp(),
      returnedBy: params.returnedBy,
      fineAmount,
      status: params.condition === "normal" ? "returned" : params.condition
    });
    transaction.update(copyRef, {
      status: nextCopyStatus,
      currentLoanId: null,
      currentIssuedToMemberId: null,
      currentIssuedToNameSnapshot: null,
      currentIssuedAt: null,
      currentDueAt: null,
      updatedAt: serverTimestamp(),
      updatedBy: params.returnedBy
    });
    transaction.set(doc(collection(db, "auditLogs")), {
      actorUid: params.returnedBy,
      actorRole: "staff",
      action: "RETURN_BOOK",
      entityType: "loan",
      entityId: loan.id,
      message: `Returned ${loan.accessionNumberSnapshot}`,
      createdAt: serverTimestamp()
    });
  });
}

export async function renewLoan(params: { loanId: string; renewedBy: string; maxRenewals: number; defaultLoanDays: number }) {
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", params.loanId);
    const loanSnap = await transaction.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Loan was not found.");
    const loan = { id: loanSnap.id, ...loanSnap.data() } as Loan;
    if (loan.returnedAt || loan.status !== "issued") throw new Error("Only active issued loans can be renewed.");
    if (loan.renewedCount >= params.maxRenewals) throw new Error("Renewal limit reached.");
    const nextDue = addDays(loan.dueAt.toDate(), params.defaultLoanDays);
    transaction.update(loanRef, {
      dueAt: Timestamp.fromDate(nextDue),
      renewedCount: loan.renewedCount + 1
    });
    transaction.update(doc(db, "bookCopies", loan.copyId), {
      currentDueAt: Timestamp.fromDate(nextDue),
      updatedAt: serverTimestamp(),
      updatedBy: params.renewedBy
    });
    transaction.set(doc(collection(db, "auditLogs")), {
      actorUid: params.renewedBy,
      actorRole: "staff",
      action: "RENEW_BOOK",
      entityType: "loan",
      entityId: loan.id,
      message: `Renewed ${loan.accessionNumberSnapshot}`,
      createdAt: serverTimestamp()
    });
  });
}

export async function getActiveLoanByCopy(copyId: string) {
  const snap = await getDocs(query(loans, where("copyId", "==", copyId), where("status", "in", ["issued", "overdue"]), limit(1)));
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as Loan);
}

export async function getActiveLoansByMember(memberId: string) {
  const snap = await getDocs(query(loans, where("memberId", "==", memberId), where("status", "in", ["issued", "overdue"]), limit(50)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Loan);
}

export async function getLoanHistoryByMember(memberId: string) {
  const snap = await getDocs(query(loans, where("memberId", "==", memberId), limit(100)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Loan);
}

export async function getLoan(loanId: string) {
  const snap = await getDoc(doc(db, "loans", loanId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Loan) : null;
}

export async function getOverdueLoans() {
  const now = Timestamp.fromDate(new Date());
  const snap = await getDocs(query(loans, where("returnedAt", "==", null), where("dueAt", "<", now), limit(100)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data(), status: "overdue" }) as Loan);
}
