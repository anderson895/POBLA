import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  loginWithEmail, registerWithEmail, logoutUser,
  ensureUserProfile, type User, type AppRole,
} from "@/lib/authService";
import { logError, logInfo } from "@/lib/errorLogger";

interface AuthContextValue {
  user: User | null;
  userRole: AppRole | null;
  isGuest: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null);
  const [userRole, setUserRole]     = useState<AppRole | null>(null);
  const [isGuest, setIsGuest]       = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        try {
          const role = await ensureUserProfile(u);
          setUserRole(role);
        } catch (err: any) {
          await logError({
            message: err.message, error: err,
            component: "AuthContext", action: "onAuthStateChanged",
            userId: u.uid,
          });
          setUserRole("customer");
        }
      } else {
        setUserRole(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: "AuthContext", action: "login", userEmail: email });
      throw err;
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      await registerWithEmail(name, email, password);
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: "AuthContext", action: "register", userEmail: email });
      throw err;
    }
  }

  async function logout() {
    try {
      await logoutUser();
      setUserRole(null);
      setIsGuest(false);
    } catch (err: any) {
      await logError({ message: err.message, error: err, component: "AuthContext", action: "logout" });
      throw err;
    }
  }

  function continueAsGuest() { setIsGuest(true); }
  function exitGuest()       { setIsGuest(false); }

  return (
    <AuthContext.Provider
      value={{ user, userRole, isGuest, authLoading, login, register, logout, continueAsGuest, exitGuest }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}