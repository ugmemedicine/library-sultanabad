"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { StatusBadge } from "@/components/StatusBadge";
import { downloadCsv, toCsv } from "@/lib/csv";
import { deactivateMember, searchMembers } from "@/services/memberService";
import { useAuth } from "@/lib/auth";
import type { LibraryMember } from "@/types";

export default function MembersPage() {
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [search, setSearch] = useState("");
  const { profile } = useAuth();
  useEffect(() => {
    searchMembers(search).then(setMembers).catch(() => setMembers([]));
  }, [search]);

  function exportCsv() {
    const rows = members.map((member) => ({
      displayName: member.displayName,
      email: member.email,
      memberCode: member.memberCode,
      address: member.address,
      phone: member.phone,
      status: member.status
    }));
    downloadCsv("members.csv", toCsv(rows));
  }

  async function handleDelete(member: LibraryMember) {
    if (!profile || !member.id) return;
    const confirmed = window.confirm(`Remove member ${member.displayName}? This will mark them as inactive.`);
    if (!confirmed) return;
    await deactivateMember(member.id);
    setMembers((current) => current.filter((item) => item.id !== member.id));
  }

  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader
          title="Members"
          text="Manage library members and view borrowing status."
          action={
            <div className="page-header-actions">
              <Link className="button" href="/members/new">Add Member</Link>
              <button className="button secondary" type="button" onClick={exportCsv}>Export CSV</button>
            </div>
          }
        />
        <div className="toolbar">
          <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, code, email, phone" />
        </div>
        <section className="panel table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Code</th><th>Address</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{members.map((member) => <tr key={member.id}><td data-label="Name"><Link href={`/members/${member.id}`}>{member.displayName}</Link></td><td data-label="Email">{member.email}</td><td data-label="Code">{member.memberCode}</td><td data-label="Address">{member.address}</td><td data-label="Phone">{member.phone}</td><td data-label="Status"><StatusBadge status={member.status} /></td><td data-label="Actions"><button className="button danger" type="button" onClick={() => handleDelete(member)} disabled={!member.id}>Delete</button></td></tr>)}</tbody>
          </table>
        </section>
      </RoleGate>
    </ProtectedRoute>
  );
}
