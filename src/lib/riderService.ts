import {
  collection, doc, addDoc, updateDoc, getDoc,
  onSnapshot, serverTimestamp, Timestamp, setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { RiderRegistration, RiderRegistrationStatus } from "@/types";
import { logError, logInfo } from "./errorLogger";

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

export async function submitRiderRegistration(data: {
  name: string; email: string; password: string;
  phone: string; vehicleType: "motorcycle" | "bicycle" | "car"; plateNumber: string;
}): Promise<string> {
  try {
    const { createUserWithEmailAndPassword, updateProfile, signOut: signOutSecondary } = await import("firebase/auth");
    const { secondaryAuth, secondaryDb } = await import("./firebase");

    const cred = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
    await updateProfile(cred.user, { displayName: data.name });
    await cred.user.getIdToken(true);

    await setDoc(doc(secondaryDb, "users", cred.user.uid), {
      uid: cred.user.uid, name: data.name.trim(), email: data.email,
      role: "delivery_pending", isOnline: false, totalDeliveries: 0, createdAt: serverTimestamp(),
    });

    const ref = await addDoc(collection(secondaryDb, COL), {
      uid: cred.user.uid, name: data.name.trim(), email: data.email,
      phone: data.phone, vehicleType: data.vehicleType,
      plateNumber: data.plateNumber.toUpperCase(),
      status: "pending", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });

    await signOutSecondary(secondaryAuth);
    await logInfo("Rider registration submitted", { component: "riderService", action: "submitRiderRegistration", userEmail: data.email });
    return ref.id;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "riderService", action: "submitRiderRegistration", userEmail: data.email });
    throw err;
  }
}

export function subscribeToRiderRegistrations(callback: (regs: RiderRegistration[]) => void, onError?: (err: Error) => void): () => void {
  return onSnapshot(collection(db, COL),
    (snap) => {
      const regs = snap.docs.map((d) => toReg(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(regs);
    },
    (err) => {
      logError({ message: err.message, error: err, component: "riderService", action: "subscribeToRiderRegistrations" });
      onError?.(err);
    }
  );
}

export async function reviewRegistration(regId: string, uid: string, action: "approved" | "rejected", rejectionReason?: string): Promise<void> {
  try {
    await updateDoc(doc(db, COL, regId), {
      status: action,
      ...(rejectionReason ? { rejectionReason } : {}),
      updatedAt: serverTimestamp(),
    });
    if (action === "approved") {
      await updateDoc(doc(db, "users", uid), { role: "delivery", isOnline: false, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(doc(db, "users", uid), { role: "rejected", updatedAt: serverTimestamp() });
    }
    await logInfo(`Rider registration ${action}`, { component: "riderService", action: "reviewRegistration", metadata: { regId, uid, action } });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "riderService", action: "reviewRegistration", metadata: { regId, uid } });
    throw err;
  }
}

export async function setRiderOnlineStatus(uid: string, isOnline: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), { isOnline, updatedAt: serverTimestamp() });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "riderService", action: "setRiderOnlineStatus", userId: uid });
    throw err;
  }
}

export async function getRiderOnlineStatus(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? ((snap.data().isOnline as boolean) ?? false) : false;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "riderService", action: "getRiderOnlineStatus", userId: uid });
    return false;
  }
}

export async function incrementRiderDeliveries(uid: string): Promise<void> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const current = (snap.data().totalDeliveries as number) ?? 0;
      await updateDoc(doc(db, "users", uid), { totalDeliveries: current + 1, updatedAt: serverTimestamp() });
    }
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "riderService", action: "incrementRiderDeliveries", userId: uid });
    throw err;
  }
}
