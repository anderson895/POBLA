import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order } from "@/types";

const COL = "orders";

function toOrder(id: string, data: Record<string, unknown>): Order {
  return {
    ...(data as Omit<Order, "id" | "createdAt" | "updatedAt">),
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

/** Save a placed order to Firestore. Returns the Firestore doc ID. */
export async function saveOrder(order: Order, userId: string): Promise<string> {
  // Build payload field-by-field — never include undefined
  const payload: Record<string, unknown> = {
    orderNumber:   order.orderNumber,
    customerId:    order.customerId,
    customerName:  order.customerName,
    customerPhone: order.customerPhone,
    items: order.items.map((item) => {
      const i: Record<string, unknown> = {
        menuItemId:   item.menuItemId,
        menuItemName: item.menuItemName,
        quantity:     item.quantity,
        unitPrice:    item.unitPrice,
        subtotal:     item.subtotal,
      };
      if (item.notes) i.notes = item.notes;
      return i;
    }),
    status:        order.status,
    orderType:     order.orderType,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal:      order.subtotal,
    deliveryFee:   order.deliveryFee,
    total:         order.total,
    userId,
    createdAt:     serverTimestamp(),
    updatedAt:     serverTimestamp(),
  };

  // Only add optional fields when they have a value
  if (order.customerAddress)   payload.customerAddress   = order.customerAddress;
  if (order.notes)             payload.notes             = order.notes;
  if (order.assignedRiderId)   payload.assignedRiderId   = order.assignedRiderId;
  if (order.assignedRiderName) payload.assignedRiderName = order.assignedRiderName;

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

/** Real-time subscription to a user's orders, newest first. */
export function subscribeToUserOrders(
  userId: string,
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COL),
    where("userId", "==", userId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const orders = snap.docs
        .map((d) => toOrder(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(orders);
    },
    (err) => {
      console.error("[orderService]", err);
      onError?.(err);
    }
  );
}