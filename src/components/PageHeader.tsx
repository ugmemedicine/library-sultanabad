import type { ReactNode } from "react";

export function PageHeader({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
      </div>
      {action}
    </div>
  );
}
