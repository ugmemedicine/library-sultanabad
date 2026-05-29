"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LibrarySettings } from "@/types";

export const defaultSettings: LibrarySettings = {
  defaultLoanDays: 14,
  maxBooksPerMember: 3,
  finePerDay: 10,
  maxRenewals: 2,
  blockBorrowingIfOverdue: true,
  currencyLabel: "PKR"
};

export async function getSettings() {
  const snap = await getDoc(doc(db, "settings", "library"));
  return snap.exists() ? ({ ...defaultSettings, ...snap.data() } as LibrarySettings) : defaultSettings;
}

export async function updateSettings(data: LibrarySettings, uid: string) {
  await setDoc(
    doc(db, "settings", "library"),
    {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: uid
    },
    { merge: true }
  );
}
