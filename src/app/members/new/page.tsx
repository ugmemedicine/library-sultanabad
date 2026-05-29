"use client";

import { MemberForm } from "@/components/MemberForm";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { createMember } from "@/services/memberService";

export default function NewMemberPage() {
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin", "librarian"]}>
        <PageHeader title="Add Member" text="Create a standalone library member record. Member code is auto-generated." />
        <MemberForm
          onSubmit={async (value) => {
            await createMember({
              displayName: value.displayName,
              email: value.email,
              memberCode: value.memberCode,
              address: value.address,
              phone: value.phone,
              status: "active"
            });
          }}
        />
      </RoleGate>
    </ProtectedRoute>
  );
}
