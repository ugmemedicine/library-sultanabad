"use client";

import { type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
