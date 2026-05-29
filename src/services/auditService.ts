"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function createAuditLog(action: string, entityType: string, entityId: string, message: string, actorUid: string, actorRole: string) {
  await addDoc(collection(db, "auditLogs"), {
    actorUid,
    actorRole,
    action,
    entityType,
    entityId,
    message,
    createdAt: serverTimestamp()
  });
}
