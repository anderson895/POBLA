import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { logError, logInfo } from "./errorLogger";

export type { User };
export type AppRole = "customer" | "kitchen" | "delivery" | "delivery_pending" | "rejected" | "owner";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt?: unknown;
}

export async function getUserRole(uid: string): Promise<AppRole> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return "customer";
    return (snap.data().role as AppRole) ?? "customer";
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "authService", action: "getUserRole", userId: uid });
    return "customer";
  }
}

export async function ensureUserProfile(user: User): Promise<AppRole> {
  try {
    const ref  = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return (snap.data().role as AppRole) ?? "customer";
    }
    const profile: UserProfile = {
      uid:   user.uid,
      name:  user.displayName ?? "Customer",
      email: user.email ?? "",
      role:  "customer",
    };
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
    return "customer";
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "authService", action: "ensureUserProfile", userId: user.uid });
    return "customer";
  }
}

export async function registerWithEmail(name: string, email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await cred.user.getIdToken(true);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name: name.trim(),
      email,
      role: "customer",
      createdAt: serverTimestamp(),
    });
    await logInfo("User registered", { component: "authService", action: "registerWithEmail", userId: cred.user.uid, userEmail: email });
    return cred.user;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "authService", action: "registerWithEmail", userEmail: email });
    throw err;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await logInfo("User logged in", { component: "authService", action: "loginWithEmail", userId: cred.user.uid, userEmail: email });
    return cred.user;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "authService", action: "loginWithEmail", userEmail: email });
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "authService", action: "logoutUser" });
    throw err;
  }
}
