"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGate } from "@/components/RoleGate";
import { defaultSettings, getSettings, updateSettings } from "@/services/settingsService";
import type { LibrarySettings } from "@/types";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<LibrarySettings>(defaultSettings);
  const [message, setMessage] = useState("");
  useEffect(() => { getSettings().then(setSettings); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    await updateSettings(settings, profile.uid);
    setMessage("Settings saved.");
  }
  return (
    <ProtectedRoute>
      <RoleGate roles={["admin"]}>
        <PageHeader title="Settings" text="Configure loan period, fine rate, borrowing limit, and renewals." />
        <form className="panel grid" onSubmit={submit}>
          <div className="form-grid">
            <label className="required-field">Default Loan Days<input className="input" type="number" value={settings.defaultLoanDays} onChange={(e) => setSettings({ ...settings, defaultLoanDays: Number(e.target.value) })} /></label>
            <label className="required-field">Max Books Per Member<input className="input" type="number" value={settings.maxBooksPerMember} onChange={(e) => setSettings({ ...settings, maxBooksPerMember: Number(e.target.value) })} /></label>
            <label className="required-field">Fine Per Day<input className="input" type="number" value={settings.finePerDay} onChange={(e) => setSettings({ ...settings, finePerDay: Number(e.target.value) })} /></label>
            <label className="required-field">Max Renewals<input className="input" type="number" value={settings.maxRenewals} onChange={(e) => setSettings({ ...settings, maxRenewals: Number(e.target.value) })} /></label>
            <label className="required-field">Currency<input className="input" value={settings.currencyLabel} onChange={(e) => setSettings({ ...settings, currencyLabel: e.target.value })} /></label>
            <label className="required-field">Block Borrowing If Overdue<select className="select" value={String(settings.blockBorrowingIfOverdue)} onChange={(e) => setSettings({ ...settings, blockBorrowingIfOverdue: e.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select></label>
          </div>
          {message && <div className="notice">{message}</div>}
          <button className="button" type="submit">Save Settings</button>
        </form>
      </RoleGate>
    </ProtectedRoute>
  );
}
