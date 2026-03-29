import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, serverTimestamp, Timestamp,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "./firebase";
import type { RiderRegistration, RiderRegistrationStatus } from "@/types";

const COL = "riderRegistrations";

function toReg(id: string, data: Record<string, unknown>): RiderRegistration {
  const toDate = (v: unknown) => v instanceof Timestamp ? v.toDate() : new Date();
  return {
    ...(data as Omit<RiderRegistration, "id" | "createdAt" | "updatedAt">),
    id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/** Rider submits registration form */
export async function submitRiderRegistration(data: {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: "motorcycle" | "bicycle" | "car";
  plateNumber: string;
}): Promise<string> {
  // Create Firebase Auth account
  const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
  await updateProfile(cred.user, { displayName: data.name });

  // Force token refresh so Firestore recognises the new auth session
  await cred.user.getIdToken(true);

  // Create user profile doc with role = "delivery_pending"
  await setDoc(doc(db, "users", cred.user.uid), {
    uid:       cred.user.uid,
    name:      data.name.trim(),
    email:     data.email,
    role:      "delivery_pending", // blocked until approved
    isOnline:  false,
    totalDeliveries: 0,
    createdAt: serverTimestamp(),
  });

  // Create registration request
  const ref = await addDoc(collection(db, COL), {
    uid:         cred.user.uid,
    name:        data.name.trim(),
    email:       data.email,
    phone:       data.phone,
    vehicleType: data.vehicleType,
    plateNumber: data.plateNumber.toUpperCase(),
    status:      "pending",
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });

  return ref.id;
}

/** Owner: subscribe to all registrations */
export function subscribeToRiderRegistrations(
  callback: (regs: RiderRegistration[]) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(collection(db, COL), snap => {
    const regs = snap.docs
      .map(d => toReg(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(regs);
  }, err => { console.error("[riderService]", err); onError?.(err); });
}

/** Owner: approve or reject a registration */
export async function reviewRegistration(
  regId: string,
  uid: string,
  action: "approved" | "rejected",
  rejectionReason?: string
): Promise<void> {
  // Update registration doc
  await updateDoc(doc(db, COL, regId), {
    status: action,
    ...(rejectionReason ? { rejectionReason } : {}),
    updatedAt: serverTimestamp(),
  });

  // Update user's role
  if (action === "approved") {
    await updateDoc(doc(db, "users", uid), {
      role: "delivery",
      isOnline: false,
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(doc(db, "users", uid), {
      role: "rejected",
      updatedAt: serverTimestamp(),
    });
  }
}

/** Rider: toggle online/offline */
export async function setRiderOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    isOnline,
    updatedAt: serverTimestamp(),
  });
}

/** Rider: get current online status */
export async function getRiderOnlineStatus(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data().isOnline as boolean ?? false) : false;
}

/** Rider: increment total deliveries count */
export async function incrementRiderDeliveries(uid: string): Promise<void> {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const current = (snap.data().totalDeliveries as number) ?? 0;
    await updateDoc(doc(db, "users", uid), {
      totalDeliveries: current + 1,
      updatedAt: serverTimestamp(),
    });
  }
}