"use client";

import { useEffect, useState } from "react";
import { getMemberByEmail, getNextMemberCode } from "@/services/memberService";

export interface MemberFormValue {
  displayName: string;
  email: string;
  memberCode: string;
  address: string;
  phone: string;
}

const emptyValue: MemberFormValue = {
  displayName: "",
  email: "",
  memberCode: "",
  address: "",
  phone: ""
};

export function MemberForm({ onSubmit }: { onSubmit: (value: MemberFormValue) => Promise<void> }) {
  const [value, setValue] = useState<MemberFormValue>(emptyValue);
  const [message, setMessage] = useState("");
  const [codeLoading, setCodeLoading] = useState(true);
  const [emailHint, setEmailHint] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    let active = true;
    setCodeLoading(true);
    getNextMemberCode()
      .then((memberCode) => {
        if (!active) return;
        setValue((current) => ({ ...current, memberCode }));
      })
      .catch(() => {
        if (!active) return;
        setValue((current) => ({ ...current, memberCode: "S001" }));
      })
      .finally(() => {
        if (active) setCodeLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function validateEmail(email: string) {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailHint("");
      return false;
    }
    try {
      const existing = await getMemberByEmail(trimmed);
      const duplicate = Boolean(existing);
      setEmailHint(duplicate ? "Email already exists." : "");
      return duplicate;
    } catch {
      setEmailHint("");
      return false;
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const duplicate = await validateEmail(value.email);
    if (duplicate) return;
    try {
      await onSubmit(value);
      setMessage("Member profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save member.");
    }
  }

  return (
    <form className="panel grid" onSubmit={submit}>
      <div className="form-grid">
        <label className="required-field">Full Name<input className="input" value={value.displayName} onChange={(e) => setValue({ ...value, displayName: e.target.value })} /></label>
        <label className="required-field">Email<input className="input" value={value.email} onChange={(e) => {
          setValue({ ...value, email: e.target.value });
          if (!emailTouched) setEmailHint("");
        }} onBlur={async () => {
          setEmailTouched(true);
          await validateEmail(value.email);
        }} /><span className="field-hint">{emailTouched ? (emailHint || "\u00a0") : "\u00a0"}</span></label>
        <label className="required-field">Member Code<input className="input" value={value.memberCode || (codeLoading ? "Generating..." : "S001")} readOnly /></label>
        <label className="required-field">Address<input className="input" value={value.address} onChange={(e) => setValue({ ...value, address: e.target.value })} /></label>
        <label className="required-field">Phone Number<input className="input" inputMode="numeric" pattern="[0-9]*" value={value.phone} onChange={(e) => setValue({ ...value, phone: e.target.value.replace(/\D/g, "") })} /></label>
      </div>
      {message && <div className="notice">{message}</div>}
      <button className="button" type="submit">Save Member</button>
    </form>
  );
}
