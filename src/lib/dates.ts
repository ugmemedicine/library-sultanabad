import { Timestamp } from "firebase/firestore";

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDate(value?: Date | Timestamp | null) {
  if (!value) return "Not set";
  const date = value instanceof Timestamp ? value.toDate() : value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function isOverdue(dueAt: Date | Timestamp, returnedAt?: Date | Timestamp | null) {
  if (returnedAt) return false;
  const due = dueAt instanceof Timestamp ? dueAt.toDate() : dueAt;
  return startOfDay(due).getTime() < startOfDay(new Date()).getTime();
}

export function daysOverdue(dueAt: Date | Timestamp, now = new Date()) {
  const due = dueAt instanceof Timestamp ? dueAt.toDate() : dueAt;
  const diff = startOfDay(now).getTime() - startOfDay(due).getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}
