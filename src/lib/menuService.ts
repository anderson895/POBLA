import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { MenuItem } from "@/types";

const COL = "menuItems";

// ─── Converter ────────────────────────────────────────────────────────────────

function toMenuItem(id: string, data: Record<string, unknown>): MenuItem {
  return {
    ...(data as Omit<MenuItem, "id" | "createdAt" | "updatedAt">),
    id,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : new Date(),
  };
}

// ─── Real-time subscription ───────────────────────────────────────────────────

/**
 * Subscribe to all menu items ordered by creation date.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToMenuItems(
  callback: (items: MenuItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) =>
        toMenuItem(d.id, d.data() as Record<string, unknown>)
      );
      callback(items);
    },
    (err) => {
      console.error("[menuService] onSnapshot error:", err);
      onError?.(err);
    }
  );
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function addMenuItem(
  item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMenuItem(
  id: string,
  updates: Partial<Omit<MenuItem, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function toggleAvailability(
  id: string,
  available: boolean
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    available,
    updatedAt: serverTimestamp(),
  });
}
