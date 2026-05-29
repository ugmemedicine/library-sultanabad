import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "librarian" | "member";
export type UserStatus = "active" | "suspended" | "inactive";
export type CopyStatus = "available" | "issued" | "lost" | "damaged" | "maintenance" | "removed";
export type LoanStatus = "issued" | "overdue" | "returned" | "lost" | "damaged" | "cancelled";
export type ReturnCondition = "normal" | "damaged" | "lost";

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LibraryMember {
  id?: string;
  displayName: string;
  email: string;
  memberCode: string;
  address: string;
  phone: string;
  status: UserStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Book {
  id?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  category: string;
  language?: string;
  description?: string;
  coverImageUrl?: string;
  keywords: string[];
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface BookCopy {
  id?: string;
  bookId: string;
  accessionNumber: string;
  barcode: string;
  status: CopyStatus;
  location: string;
  shelf?: string;
  condition: "new" | "good" | "fair" | "poor" | "damaged";
  notes?: string;
  currentLoanId?: string | null;
  currentIssuedToMemberId?: string | null;
  currentIssuedToNameSnapshot?: string | null;
  currentIssuedAt?: Timestamp | null;
  currentDueAt?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface Loan {
  id?: string;
  memberId: string;
  memberNameSnapshot: string;
  memberEmailSnapshot: string;
  bookId: string;
  bookTitleSnapshot: string;
  bookAuthorsSnapshot?: string[];
  copyId: string;
  accessionNumberSnapshot: string;
  issuedAt?: Timestamp;
  dueAt: Timestamp;
  returnedAt?: Timestamp | null;
  status: LoanStatus;
  issuedBy: string;
  returnedBy?: string | null;
  renewedCount: number;
  fineAmount: number;
  notes?: string;
}

export interface LibrarySettings {
  defaultLoanDays: number;
  maxBooksPerMember: number;
  finePerDay: number;
  maxRenewals: number;
  blockBorrowingIfOverdue: boolean;
  currencyLabel: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export interface ReportFilters {
  from?: Date;
  to?: Date;
  memberId?: string;
  bookId?: string;
  status?: LoanStatus;
  query?: string;
}
