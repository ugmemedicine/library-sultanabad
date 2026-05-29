"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import type { AppUser } from "@/types";

interface AuthContextValue {
  firebaseReady: boolean;
  testMode: boolean;
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [testMode, setTestMode] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wantsTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
    const isLocalhost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (wantsTestMode && isLocalhost) {
      setTestMode(true);
      setFirebaseUser({ uid: "test-admin" } as User);
      setProfile({
        uid: "test-admin",
        displayName: "Test Admin",
        email: "test-admin@local",
        role: "admin",
        status: "active"
      });
      setLoading(false);
      return;
    }
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const profileSnap = await getDoc(doc(db, "users", user.uid));
      setProfile(profileSnap.exists() ? ({ uid: user.uid, ...profileSnap.data() } as AppUser) : null);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseReady: firebaseConfigured,
      testMode,
      firebaseUser,
      profile,
      loading,
      login: async (email, password) => {
        if (testMode) return;
        await signInWithEmailAndPassword(auth, email, password);
      },
      logout: async () => {
        if (testMode) return;
        await signOut(auth);
      }
    }),
    [firebaseUser, loading, profile, testMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
