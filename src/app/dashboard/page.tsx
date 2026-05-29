"use client";

import Link from "next/link";
import { collection, getCountFromServer, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/lib/firebase";
import { listActiveBooks } from "@/services/bookService";
import { listCopies } from "@/services/copyService";
import { getOverdueLoans } from "@/services/loanService";

type Metric = {
  href: string;
  label: string;
  value: string;
};

const cards = [
  { href: "/books", label: "Total book titles" },
  { href: "/copies", label: "Total copies" },
  { href: "/copies", label: "Available copies" },
  { href: "/reports/issued", label: "Issued copies" },
  { href: "/reports/overdue", label: "Overdue loans" },
  { href: "/members", label: "Active members" },
  { href: "/reports", label: "Fines pending" }
];

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>(cards.map((card) => ({ ...card, value: "..." })));

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      const usersCol = collection(db, "users");
      const loansCol = collection(db, "loans");

      const results = await Promise.allSettled([
        listActiveBooks(),
        listCopies(),
        getCountFromServer(query(usersCol, where("status", "==", "active"), where("role", "==", "member"))),
        getOverdueLoans(),
        getDocs(query(loansCol, where("fineAmount", ">", 0)))
      ]);

      if (!active) return;

      const books = results[0].status === "fulfilled" ? results[0].value : null;
      const booksCount = books ? formatCount(books.length) : "—";
      const copies = results[1].status === "fulfilled" ? results[1].value : null;
      const copiesCount = copies ? formatCount(copies.length) : "—";
      const availableCopiesCount = copies ? formatCount(copies.filter((copy) => copy.status === "available").length) : "—";
      const issuedCopiesCount = copies ? formatCount(copies.filter((copy) => copy.status === "issued").length) : "—";
      const activeMembersCount = results[2].status === "fulfilled" ? formatCount(results[2].value.data().count) : "—";
      const overdueLoansCount = results[3].status === "fulfilled" ? formatCount(results[3].value.length) : "—";
      const finesTotal = results[4].status === "fulfilled"
        ? `PKR ${formatCount(results[4].value.docs.reduce((sum, snap) => sum + (Number(snap.data().fineAmount) || 0), 0))}`
        : "—";

      setMetrics([
        { href: "/books", label: "Total book titles", value: booksCount },
        { href: "/copies", label: "Total copies", value: copiesCount },
        { href: "/copies", label: "Available copies", value: availableCopiesCount },
        { href: "/reports/issued", label: "Issued copies", value: issuedCopiesCount },
        { href: "/reports/overdue", label: "Overdue loans", value: overdueLoansCount },
        { href: "/members", label: "Active members", value: activeMembersCount },
        { href: "/reports", label: "Fines pending", value: finesTotal }
      ]);
    }

    loadMetrics();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ProtectedRoute>
      <PageHeader title="Dashboard" text="Operational summary for catalog, circulation, members, and fines." />
      <section className="grid cards">
        {metrics.map((metric, index) => (
          <Link className={`card metric-card metric-card-${(index % 4) + 1}`} href={metric.href} key={metric.label}>
            <div className="metric-card-top">
              <div className="metric-card-value">{metric.value}</div>
              <div className="metric-card-pill">{metric.label.slice(0, 1)}</div>
            </div>
            <div className="metric-card-label">{metric.label}</div>
            <div className="metric-card-sub muted">View details</div>
          </Link>
        ))}
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Core workflows</h2>
        <div className="toolbar">
          <Link className="button" href="/circulation/issue">Issue Book</Link>
          <Link className="button secondary" href="/circulation/return">Return Book</Link>
          <Link className="button secondary" href="/books/new">Add Book</Link>
          <Link className="button secondary" href="/members/new">Add Member</Link>
        </div>
      </section>
    </ProtectedRoute>
  );
}
