import type { CopyStatus, LoanStatus, UserStatus } from "@/types";

export function StatusBadge({ status }: { status: CopyStatus | LoanStatus | UserStatus | string }) {
  return <span className={`badge ${status}`}>{status}</span>;
}
