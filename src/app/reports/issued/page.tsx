"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ReportFiltersBar, type ReportFilterFormState } from "@/components/ReportFiltersBar";
import { ReportTable } from "@/components/ReportTable";
import { RoleGate } from "@/components/RoleGate";
import { downloadCsv, toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/dates";
import { getIssuedReport } from "@/services/reportService";
import type { Loan, ReportFilters } from "@/types";

const initialFilters: ReportFilterFormState = {
  from: "",
  to: "",
  query: "",
  status: ""
};

export default function IssuedReportPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filters, setFilters] = useState<ReportFilterFormState>(initialFilters);

  const loadData = async (nextFilters: ReportFilterFormState) => {
    const request: ReportFilters = {
      status: nextFilters.status || undefined,
      query: nextFilters.query || undefined,
      from: nextFilters.from ? new Date(nextFilters.from) : undefined,
      to: nextFilters.to ? new Date(nextFilters.to) : undefined
    };
    setLoans(await getIssuedReport(request));
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
    downloadCsv("issued-report.csv", toCsv(rows));
  };

  useEffect(() => {
    loadData(initialFilters);
  }, []);

  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Issued Report" text="Active issued and overdue loan records." />
        <ReportFiltersBar
          filters={filters}
          showStatus
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
