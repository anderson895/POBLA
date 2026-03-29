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
export type AppRole = "customer" | "kitchen" | "delivery" | "delivery_pending" | "rejected" | "owner";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt?: unknown;
}

/** Fetch a user's role from Firestore. Returns "customer" if doc missing or error. */
export async function getUserRole(uid: string): Promise<AppRole> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return "customer";
    return (snap.data().role as AppRole) ?? "customer";
  } catch {
    return "customer";
  }
}

/**
 * Called on every onAuthStateChanged — ensures a Firestore user doc exists.
 * If the doc is already there (normal login), does nothing.
 * If missing (race condition after register, or legacy account), creates it.
 * Returns the user's role.
 */
export async function ensureUserProfile(user: User): Promise<AppRole> {
  const ref  = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return (snap.data().role as AppRole) ?? "customer";
  }

  // Doc is missing — create it now (handles the Auth→Firestore race)
  const profile: UserProfile = {
    uid:   user.uid,
    name:  user.displayName ?? "Customer",
    email: user.email ?? "",
    role:  "customer",
  };
  await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  return "customer";
}

/** Register — creates Firebase Auth account + Firestore profile (role: customer) */
export async function registerWithEmail(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  // Force a token refresh so Firestore recognises the new user's auth session
  // before we attempt to write — without this, setDoc can fail with
  // "Missing or insufficient permissions" on freshly-created accounts.
  await cred.user.getIdToken(true);

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