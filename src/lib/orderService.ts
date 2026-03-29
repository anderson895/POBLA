import {
  collection, addDoc, doc, updateDoc, query, where,
  onSnapshot, serverTimestamp, Timestamp, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderStatus } from "@/types";

const COL = "orders";

function toOrder(id: string, data: Record<string, unknown>): Order {
  const toDate = (v: unknown) =>
    v instanceof Timestamp ? v.toDate() : new Date();
  return {
    ...(data as Omit<Order, "id" | "createdAt" | "updatedAt">),
    id,
    createdAt:   toDate(data.createdAt),
    updatedAt:   toDate(data.updatedAt),
    confirmedAt: data.confirmedAt ? toDate(data.confirmedAt) : undefined,
    preparedAt:  data.preparedAt  ? toDate(data.preparedAt)  : undefined,
    pickedUpAt:  data.pickedUpAt  ? toDate(data.pickedUpAt)  : undefined,
    deliveredAt: data.deliveredAt ? toDate(data.deliveredAt) : undefined,
  };
}

/** Save a new order to Firestore (status = "pending") */
export async function saveOrder(order: Order, userId: string): Promise<string> {
  const payload: Record<string, unknown> = {
    orderNumber:             order.orderNumber,
    customerId:              order.customerId,
    customerName:            order.customerName,
    customerPhone:           order.customerPhone,
    items:                   order.items.map(item => ({
      menuItemId:   item.menuItemId,
      menuItemName: item.menuItemName,
      quantity:     item.quantity,
      unitPrice:    item.unitPrice,
      subtotal:     item.subtotal,
      ...(item.notes ? { notes: item.notes } : {}),
    })),
    status:                  "pending",   // Always starts as pending
    orderType:               order.orderType,
    paymentMethod:           order.paymentMethod,
    paymentStatus:           order.paymentStatus,
    subtotal:                order.subtotal,
    deliveryFee:             order.deliveryFee,
    total:                   order.total,
    estimatedReadyMinutes:   order.estimatedReadyMinutes ?? 20,
    estimatedDeliveryMinutes:order.estimatedDeliveryMinutes ?? 45,
    userId,
    createdAt:               serverTimestamp(),
    updatedAt:               serverTimestamp(),
  };
  if (order.customerAddress) payload.customerAddress = order.customerAddress;
  if (order.customerEmail)   payload.customerEmail   = order.customerEmail;
  if (order.notes)           payload.notes           = order.notes;

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

/** Generic status update with optional extra fields */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const tsField: Record<OrderStatus, string | null> = {
    pending:          null,
    confirmed:        "confirmedAt",
    preparing:        null,
    ready:            "preparedAt",
    picked_up:        "pickedUpAt",
    out_for_delivery: null,
    delivered:        "deliveredAt",
    completed:        "deliveredAt",
    cancelled:        null,
  };
  const ts = tsField[status];
  await updateDoc(doc(db, COL, orderId), {
    status,
    ...(ts ? { [ts]: serverTimestamp() } : {}),
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

/** Cashier: subscribe to pending orders */
export function subscribeToPendingOrders(
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), where("status", "==", "pending"));
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}

/** Kitchen: subscribe to confirmed, preparing, ready orders */
export function subscribeToKitchenOrders(
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COL),
    where("status", "in", ["confirmed", "preparing", "ready"])
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}

/** Delivery: subscribe to ready (unassigned) delivery orders */
export function subscribeToAvailableDeliveries(
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COL),
    where("status", "==", "ready"),
    where("orderType", "==", "delivery")
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .filter(o => !o.assignedRiderId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}

/** Delivery: subscribe to orders assigned to a specific rider */
export function subscribeToRiderOrders(
  riderId: string,
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COL),
    where("assignedRiderId", "==", riderId),
    where("status", "in", ["picked_up", "out_for_delivery"])
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}

/** Customer: subscribe to a single order for tracking */
export function subscribeToOrder(
  orderId: string,
  callback: (order: Order | null) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(doc(db, COL, orderId),
    snap => callback(snap.exists() ? toOrder(snap.id, snap.data() as Record<string, unknown>) : null),
    err => { console.error("[orderService]", err); onError?.(err); }
  );
}

/** Customer: all orders for a user (newest first) */
export function subscribeToUserOrders(
  userId: string,
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, COL), where("userId", "==", userId));
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}

/** Rider: all orders ever assigned to this rider (by assignedRiderId) */
export function subscribeToRiderHistory(
  riderId: string,
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COL),
    where("assignedRiderId", "==", riderId)
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}

/** Owner: all orders */
export function subscribeToAllOrders(
  callback: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(collection(db, COL), snap => {
    const orders = snap.docs
      .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(orders);
  }, err => { console.error("[orderService]", err); onError?.(err); });
}