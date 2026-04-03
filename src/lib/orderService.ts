import {
  collection, addDoc, doc, updateDoc, query, where,
  onSnapshot, serverTimestamp, Timestamp, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderStatus } from "@/types";
import { logError, logInfo } from "./errorLogger";

const COL = "orders";

function toOrder(id: string, data: Record<string, unknown>): Order {
  const toDate = (v: unknown) => v instanceof Timestamp ? v.toDate() : new Date();
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

export async function saveOrder(order: Order, userId: string): Promise<string> {
  try {
    const payload: Record<string, unknown> = {
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items.map(item => ({
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        ...(item.notes ? { notes: item.notes } : {}),
      })),
      status: "pending",
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      estimatedReadyMinutes: order.estimatedReadyMinutes ?? 20,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes ?? 45,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (order.customerAddress) payload.customerAddress = order.customerAddress;
    if (order.customerEmail)   payload.customerEmail   = order.customerEmail;
    if (order.notes)           payload.notes           = order.notes;

    const ref = await addDoc(collection(db, COL), payload);
    await logInfo("Order created", { component: "orderService", action: "saveOrder", userId, metadata: { orderId: ref.id, total: order.total } });
    return ref.id;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "orderService", action: "saveOrder", userId });
    throw err;
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, extra: Record<string, unknown> = {}): Promise<void> {
  try {
    const tsField: Record<OrderStatus, string | null> = {
      pending: null, confirmed: "confirmedAt", preparing: null, ready: "preparedAt",
      picked_up: "pickedUpAt", out_for_delivery: null, delivered: "deliveredAt",
      completed: "deliveredAt", cancelled: null,
    };
    const ts = tsField[status];
    await updateDoc(doc(db, COL, orderId), {
      status,
      ...(ts ? { [ts]: serverTimestamp() } : {}),
      ...extra,
      updatedAt: serverTimestamp(),
    });
    await logInfo("Order status updated", { component: "orderService", action: "updateOrderStatus", metadata: { orderId, status } });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: "orderService", action: "updateOrderStatus", metadata: { orderId, status } });
    throw err;
  }
}

export function subscribeToPendingOrders(callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  const q = query(collection(db, COL), where("status", "==", "pending"));
  return onSnapshot(q,
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToPendingOrders" }); onError?.(err); }
  );
}

export function subscribeToKitchenOrders(callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  const q = query(collection(db, COL), where("status", "in", ["confirmed", "preparing", "ready"]));
  return onSnapshot(q,
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToKitchenOrders" }); onError?.(err); }
  );
}

export function subscribeToAvailableDeliveries(callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  const q = query(collection(db, COL), where("status", "==", "ready"), where("orderType", "==", "delivery"));
  return onSnapshot(q,
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).filter(o => !o.assignedRiderId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToAvailableDeliveries" }); onError?.(err); }
  );
}

export function subscribeToRiderOrders(riderId: string, callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  const q = query(collection(db, COL), where("assignedRiderId", "==", riderId), where("status", "in", ["picked_up", "out_for_delivery"]));
  return onSnapshot(q,
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToRiderOrders", userId: riderId }); onError?.(err); }
  );
}

export function subscribeToOrder(orderId: string, callback: (order: Order | null) => void, onError?: (err: Error) => void): () => void {
  return onSnapshot(doc(db, COL, orderId),
    snap => callback(snap.exists() ? toOrder(snap.id, snap.data() as Record<string, unknown>) : null),
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToOrder", metadata: { orderId } }); onError?.(err); }
  );
}

export function subscribeToUserOrders(userId: string, callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  const q = query(collection(db, COL), where("userId", "==", userId));
  return onSnapshot(q,
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToUserOrders", userId }); onError?.(err); }
  );
}

export function subscribeToRiderHistory(riderId: string, callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  const q = query(collection(db, COL), where("assignedRiderId", "==", riderId));
  return onSnapshot(q,
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToRiderHistory", userId: riderId }); onError?.(err); }
  );
}

export function subscribeToAllOrders(callback: (orders: Order[]) => void, onError?: (err: Error) => void): () => void {
  return onSnapshot(collection(db, COL),
    snap => { callback(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())); },
    err => { logError({ message: err.message, error: err, component: "orderService", action: "subscribeToAllOrders" }); onError?.(err); }
  );
}
