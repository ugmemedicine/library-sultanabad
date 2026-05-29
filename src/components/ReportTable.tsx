import { formatDate } from "@/lib/dates";
import { StatusBadge } from "@/components/StatusBadge";
import type { Loan } from "@/types";

export function ReportTable({ loans }: { loans: Loan[] }) {
  return (
    <section className="panel table-wrap">
      <table>
        <thead><tr><th>Book</th><th>Member</th><th>Accession</th><th>Issued</th><th>Due</th><th>Returned</th><th>Status</th><th>Fine</th></tr></thead>
        <tbody>
          {!loans.length ? (
            <tr>
              <td className="muted" colSpan={8}>No records found for the current filters.</td>
            </tr>
          ) : loans.map((loan) => (
            <tr key={loan.id}>
              <td data-label="Book">{loan.bookTitleSnapshot}</td>
              <td data-label="Member">{loan.memberNameSnapshot}</td>
              <td data-label="Accession">{loan.accessionNumberSnapshot}</td>
              <td data-label="Issued">{formatDate(loan.issuedAt)}</td>
              <td data-label="Due">{formatDate(loan.dueAt)}</td>
              <td data-label="Returned">{formatDate(loan.returnedAt)}</td>
              <td data-label="Status"><StatusBadge status={loan.status} /></td>
              <td data-label="Fine">{loan.fineAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
