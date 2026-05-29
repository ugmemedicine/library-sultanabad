import type { Timestamp } from "firebase/firestore";
import { daysOverdue } from "@/lib/dates";

export function calculateFine(dueAt: Date | Timestamp, finePerDay: number, now = new Date()) {
  return daysOverdue(dueAt, now) * finePerDay;
}
