"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ReportFiltersBar, type ReportFilterFormState } from "@/components/ReportFiltersBar";
import { ReportTable } from "@/components/ReportTable";
import { RoleGate } from "@/components/RoleGate";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/dates";
import { getReturnedReport } from "@/services/reportService";
import type { Loan, ReportFilters } from "@/types";

const initialFilters: ReportFilterFormState = {
  from: "",
  to: "",
  query: ""
};

export default function ReturnedReportPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filters, setFilters] = useState<ReportFilterFormState>(initialFilters);

  const loadData = async (nextFilters: ReportFilterFormState) => {
    const request: ReportFilters = {
      query: nextFilters.query || undefined,
      from: nextFilters.from ? new Date(nextFilters.from) : undefined,
      to: nextFilters.to ? new Date(nextFilters.to) : undefined
    };
    setLoans(await getReturnedReport(request));
  };

  const handleExport = () => {
    const rows = loans.map((loan) => ({
      book: loan.bookTitleSnapshot,
      member: loan.memberNameSnapshot,
      accession: loan.accessionNumberSnapshot,
      issuedAt: formatDate(loan.issuedAt),
      dueAt: formatDate(loan.dueAt),
      returnedAt: formatDate(loan.returnedAt),
      status: loan.status,
      fineAmount: loan.fineAmount
    }));
    downloadCsv("returned-report.csv", toCsv(rows));
  };

  useEffect(() => {
    loadData(initialFilters);
  }, []);

  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Returned Report" text="Historical returned loan records. These are never deleted on return." />
        <ReportFiltersBar
          filters={filters}
          onChange={setFilters}
          onApply={() => loadData(filters)}
          onReset={() => {
            setFilters(initialFilters);
            loadData(initialFilters);
          }}
          onExport={handleExport}
        />
        <ReportTable loans={loans} />
      </RoleGate>
    </ProtectedRoute>
  );
}
