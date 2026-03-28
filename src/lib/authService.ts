import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type { User };
export type AppRole = "customer" | "kitchen" | "delivery" | "owner" | "staff" | "manager";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt?: unknown;
}

/** Fetch a user's role from Firestore. Defaults to "customer" if no doc. */
export async function getUserRole(uid: string): Promise<AppRole> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "customer";
  return (snap.data().role as AppRole) ?? "customer";
}

/** Register — creates Firebase Auth account + Firestore profile (role: customer) */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  await setDoc(doc(db, "users", cred.user.uid), {
    uid:       cred.user.uid,
    name:      name.trim(),
    email,
    role:      "customer",
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
