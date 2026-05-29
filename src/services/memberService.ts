"use client";

import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validateMember } from "@/lib/validators";
import type { LibraryMember } from "@/types";

const members = collection(db, "members");

function nextMemberCode(existingCodes: string[]) {
  const highest = existingCodes.reduce((max, code) => {
    const match = /^S(\d{3,})$/i.exec(code.trim());
    if (!match) return max;
    return Math.max(max, Number(match[1]) || 0);
  }, 0);
  return `S${String(highest + 1).padStart(3, "0")}`;
}

export async function getNextMemberCode() {
  const memberSnap = await getDocs(query(members, limit(1000)));
  const existingCodes = memberSnap.docs.map((item) => String(item.data().memberCode ?? ""));
  const code = nextMemberCode(existingCodes);
  return code || "S001";
}

export async function getMemberByEmail(email: string, excludeMemberId?: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  const snap = await getDocs(query(members, limit(1000)));
  const docSnap = snap.docs.find((item) => {
    if (excludeMemberId && item.id === excludeMemberId) return false;
    return String(item.data().email ?? "").trim().toLowerCase() === trimmed;
  });
  return docSnap ? ({ id: docSnap.id, ...docSnap.data() } as LibraryMember) : null;
}

export async function createMember(data: Omit<LibraryMember, "id" | "createdAt" | "updatedAt">) {
  validateMember({ displayName: data.displayName, email: data.email, address: data.address, phone: data.phone });
  const existingEmail = await getMemberByEmail(data.email);
  if (existingEmail) throw new Error("Email already exists.");
  let memberCode = data.memberCode?.trim() || (await getNextMemberCode());

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await getMemberByMemberCode(memberCode);
    if (!existing) break;
    memberCode = await getNextMemberCode();
  }

  const memberRef = doc(members);
  await setDoc(memberRef, {
    ...data,
    memberCode,
    status: data.status ?? "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return memberRef.id;
}

export async function updateMember(memberId: string, data: Partial<LibraryMember>) {
  if (data.email) {
    validateMember({
      displayName: data.displayName ?? "Temporary",
      email: data.email,
      address: data.address ?? "Temporary",
      phone: data.phone ?? "0"
    });
    const existingEmail = await getMemberByEmail(data.email, memberId);
    if (existingEmail) throw new Error("Email already exists.");
  }
  await updateDoc(doc(db, "members", memberId), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function getMember(memberId: string) {
  const snap = await getDoc(doc(db, "members", memberId));
  if (!snap.exists()) return null;
  const member = { id: snap.id, ...snap.data() } as LibraryMember;
  return member.status === "inactive" ? null : member;
}

export async function getMemberByMemberCode(memberCode: string) {
  const trimmed = memberCode.trim();
  if (!trimmed) return null;
  const snap = await getDocs(query(members, limit(1000)));
  const docSnap = snap.docs.find((item) => String(item.data().memberCode ?? "").trim() === trimmed);
  return docSnap ? ({ id: docSnap.id, ...docSnap.data() } as LibraryMember) : null;
}

export async function lookupMember(search: string) {
  const matches = await searchMembers(search);
  if (!matches.length) return null;
  const trimmed = search.trim().toLowerCase();
  return (
    matches.find((member) => member.memberCode.toLowerCase() === trimmed) ??
    matches.find((member) => member.displayName.toLowerCase() === trimmed) ??
    matches.find((member) => member.email.toLowerCase() === trimmed) ??
    matches[0]
  );
}

export async function searchMembers(search: string) {
  const trimmed = search.trim().toLowerCase();
  const snap = await getDocs(query(members, orderBy("displayName"), limit(1000)));
  const items = snap.docs
    .map((item) => ({ id: item.id, ...item.data() }) as LibraryMember)
    .filter((member) => member.status !== "inactive");
  if (!trimmed) return items;
  return items.filter((member) => {
    const haystack = `${member.displayName} ${member.memberCode} ${member.email} ${member.address} ${member.phone}`.toLowerCase();
    return haystack.includes(trimmed);
  });
}

export async function suspendMember(memberId: string) {
  await updateMember(memberId, { status: "suspended" });
}

export async function activateMember(memberId: string) {
  await updateMember(memberId, { status: "active" });
}

export async function deactivateMember(memberId: string) {
  await updateMember(memberId, { status: "inactive" });
}
