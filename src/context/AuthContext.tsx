import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile, type AppRole } from "@/lib/authService";
import { logError } from "@/lib/errorLogger";

interface AuthContextType {
  user: User | null;
  userRole: AppRole | null;
  isGuest: boolean;
  authLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [userRole, setUserRole]   = useState<AppRole | null>(null);
  const [authLoading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const role = await ensureUserProfile(firebaseUser);
          setUserRole(role);
        } catch (err: any) {
          await logError({ message: err.message, error: err, component: "AuthContext", action: "onAuthStateChanged", userId: firebaseUser.uid });
          setUserRole("customer");
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function logout() {
    const { logoutUser } = await import("@/lib/authService");
    await logoutUser();
    setUser(null);
    setUserRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, userRole, isGuest: !user, authLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
