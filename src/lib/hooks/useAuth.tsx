"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase/config";
import { useAuthStore } from "@/lib/store/authStore";
import type { UserProfile } from "@/types/user";

interface AuthContextValue {
  firebaseUser: ReturnType<typeof useAuthStore.getState>["firebaseUser"];
  profile: UserProfile | null;
  isLoading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Listen for auth state changes (login, logout, token refresh).
  // We also set/clear a lightweight, non-sensitive cookie so
  // middleware.ts can make fast redirect decisions without waiting
  // for client-side hydration.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        document.cookie = "cm_session=1; path=/; max-age=2592000; SameSite=Lax";
      } else {
        document.cookie = "cm_session=; path=/; max-age=0";
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once we have a signed-in, non-anonymous user, subscribe to their
  // Firestore profile document in real time (rating updates, etc.)
  useEffect(() => {
    if (!firebaseUser || firebaseUser.isAnonymous) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(firestore, "users", firebaseUser.uid),
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid, firebaseUser?.isAnonymous]);

  const value: AuthContextValue = {
    firebaseUser,
    profile,
    isLoading,
    isGuest: !!firebaseUser?.isAnonymous,
    isAuthenticated: !!firebaseUser && !firebaseUser.isAnonymous,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
