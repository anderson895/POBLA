import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  ensureUserProfile,
  type User,
  type AppRole,
} from "@/lib/authService";

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
  const [user, setUser]           = useState<User | null>(null);
  const [userRole, setUserRole]   = useState<AppRole | null>(null);
  const [isGuest, setIsGuest]     = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
        try {
          // ensureUserProfile creates the Firestore doc if missing (race condition fix)
          const role = await ensureUserProfile(u);
          setUserRole(role);
        } catch {
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
    // Just fire the login — onAuthStateChanged will handle setUser, setUserRole, setIsGuest.
    // Avoid duplicate ensureUserProfile calls that cause a race condition where
    // userRole briefly becomes null between the two competing setState calls,
    // preventing the LoginPage overlay from closing.
    await loginWithEmail(email, password);
  }

  async function register(name: string, email: string, password: string) {
    // registerWithEmail does: createUser → updateProfile → setDoc (in order)
    // onAuthStateChanged fires after createUser, potentially before setDoc finishes.
    // getUserRole now retries, so the listener will resolve correctly.
    await registerWithEmail(name, email, password);
  }

  async function logout() {
    await logoutUser();
    setUserRole(null);
    setIsGuest(false);
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