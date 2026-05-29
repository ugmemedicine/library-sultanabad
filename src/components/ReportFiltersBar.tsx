import type { LoanStatus } from "@/types";

export interface ReportFilterFormState {
  from: string;
  to: string;
  query: string;
  status?: LoanStatus | "";
}

export function ReportFiltersBar({
  filters,
  showStatus,
  onChange,
  onApply,
  onReset,
  onExport
}: {
  filters: ReportFilterFormState;
  showStatus?: boolean;
  onChange: (next: ReportFilterFormState) => void;
  onApply: () => void;
  onReset: () => void;
  onExport: () => void;
}) {
  return (
    <section className="panel">
      <div className="form-grid report-filters">
        <label>
          From Date
          <input className="input" type="date" value={filters.from} onChange={(event) => onChange({ ...filters, from: event.target.value })} />
        </label>
        <label>
          To Date
          <input className="input" type="date" value={filters.to} onChange={(event) => onChange({ ...filters, to: event.target.value })} />
        </label>
        <label className="report-filters-query">
          Search
          <input
            className="input"
            type="search"
            placeholder="Book, member, accession"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
          />
        </label>
        {showStatus ? (
          <label>
            Status
            <select className="select" value={filters.status ?? ""} onChange={(event) => onChange({ ...filters, status: (event.target.value || "") as LoanStatus | "" })}>
              <option value="">All</option>
              <option value="issued">Issued</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
        ) : null}
      </div>
      <div className="toolbar report-filters-actions">
        <button className="button" type="button" onClick={onApply}>Apply Filters</button>
        <button className="button secondary" type="button" onClick={onReset}>Reset</button>
        <button className="button secondary" type="button" onClick={onExport}>Export CSV</button>
      </div>
    </section>
  );
}
