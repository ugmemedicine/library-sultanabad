"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@/types";

export function RoleGate({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile || !roles.includes(profile.role)) {
    return (
      <div className="panel">
        <h2>Unauthorized</h2>
        <p className="muted">Your role does not have access to this workflow.</p>
      </div>
    );
  }
  return <>{children}</>;
}
