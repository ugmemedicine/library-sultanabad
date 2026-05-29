"use client";

import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import type { AppUser } from "@/types";

interface AuthContextValue {
  firebaseReady: boolean;
  testMode: boolean;
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  ensureProfile: () => Promise<AppUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function buildBootstrapProfile(user: User): AppUser {
  return {
    uid: user.uid,
    displayName: user.displayName?.trim() || user.email?.split("@")[0] || "Library User",
    email: user.email || "",
    role: "member",
    status: "active"
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [testMode, setTestMode] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(true);
  const authReadyTimeoutRef = useRef<number | null>(null);

  const syncUserProfile = useCallback(async (user: User) => {
    const profileRef = doc(db, "users", user.uid);
    try {
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const loadedProfile = { uid: user.uid, ...profileSnap.data() } as AppUser;
        setProfile(loadedProfile);
        return loadedProfile;
      }
    } catch (error) {
      console.warn("Profile read failed; attempting bootstrap for missing profile.", error);
    }

    const bootstrapProfile = buildBootstrapProfile(user);

    await setDoc(profileRef, bootstrapProfile);
    setProfile(bootstrapProfile);
    return bootstrapProfile;
  }, []);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

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
    if (authReadyTimeoutRef.current) window.clearTimeout(authReadyTimeoutRef.current);
    authReadyTimeoutRef.current = window.setTimeout(() => {
      if (!loadingRef.current) return;
      console.warn("Auth state took too long to resolve; falling back to the current Firebase user.");
      setFirebaseUser(auth.currentUser);
      setLoading(false);
    }, 7000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (authReadyTimeoutRef.current) {
        window.clearTimeout(authReadyTimeoutRef.current);
        authReadyTimeoutRef.current = null;
      }
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(false);
      try {
        await syncUserProfile(user);
      } catch (error) {
        console.error("Failed to load or bootstrap the user profile.", error);
        setProfile(null);
      }
    });
    return () => {
      if (authReadyTimeoutRef.current) {
        window.clearTimeout(authReadyTimeoutRef.current);
        authReadyTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [syncUserProfile]);

  const value = useMemo<AuthContextValue>(
      () => ({
        firebaseReady: firebaseConfigured,
        testMode,
        firebaseUser,
        profile,
        loading,
        ensureProfile: async () => {
          if (!auth.currentUser) return null;
          try {
            return await syncUserProfile(auth.currentUser);
          } catch (error) {
            console.error("Failed to ensure the current user profile.", error);
            return null;
          }
        },
        login: async (email, password) => {
          if (testMode) return;
        const result = await signInWithEmailAndPassword(auth, email, password);
        setFirebaseUser(result.user);
        setLoading(false);
        void syncUserProfile(result.user).catch((error) => {
          console.error("Failed to bootstrap user after login.", error);
        });
        },
        logout: async () => {
          if (testMode) return;
        await signOut(auth);
        setFirebaseUser(null);
        setProfile(null);
        setLoading(false);
        }
      }),
      [firebaseUser, loading, profile, syncUserProfile, testMode]
    );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
