import type { UserRole } from "@/types";

export const publicRoutes = ["/login", "/unauthorized"];

export const navItems = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin", "librarian", "member"] },
  { href: "/books", label: "Books", roles: ["admin", "librarian", "member"] },
  { href: "/copies", label: "Copies", roles: ["admin", "librarian"] },
  { href: "/members", label: "Members", roles: ["admin", "librarian"] },
  { href: "/circulation/issue", label: "Issue", roles: ["admin", "librarian"] },
  { href: "/circulation/return", label: "Return", roles: ["admin", "librarian"] },
  { href: "/circulation/renew", label: "Renew", roles: ["admin", "librarian"] },
  { href: "/reports", label: "Reports", roles: ["admin", "librarian"] },
  { href: "/settings", label: "Settings", roles: ["admin"] }
] as const;

export function canAccess(role: UserRole | undefined, roles: readonly string[]) {
  return Boolean(role && roles.includes(role));
}
