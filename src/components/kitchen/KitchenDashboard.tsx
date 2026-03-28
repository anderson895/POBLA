import React, { useState, useEffect } from "react";
import type { Order, OrderStatus } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, ClockIcon, BellAlertIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendOrderReadyNotification } from "@/lib/emailService";

function toOrder(id: string, data: Record<string, unknown>): Order {
  return {
    ...(data as Omit<Order, "id" | "createdAt" | "updatedAt">),
    id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

function OrderCard({ order, onStatus }: { order: Order; onStatus: (id: string, s: OrderStatus) => void }) {
  const isNew  = order.status === "confirmed";
  const isPrep = order.status === "preparing";
  const isReady= order.status === "ready";
  const mins   = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isNew   && "ring-2 ring-yellow-400/40 border-yellow-300",
      isPrep  && "ring-2 ring-brand/30 border-brand/40",
      isReady && "ring-2 ring-green-400/30 border-green-300",
    )}>
      <div className={cn("h-1.5", isNew ? "bg-yellow-400" : isPrep ? "bg-brand" : "bg-green-500")} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            {isNew && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1 mb-1.5 animate-pulse">
                <BellAlertIcon className="w-3 h-3" /> NEW ORDER
              </Badge>
            )}
            <p className="font-display font-black text-sm text-foreground">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.customerName} •{" "}
              <Badge variant={order.orderType === "delivery" ? "info" : "warning"} className="text-[10px] px-1.5 py-0">
                {order.orderType}
              </Badge>
            </p>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" />
            {mins < 1 ? "Just now" : `${mins}m ago`}
          </span>
        </div>

        <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl mb-3">
          {order.items.map(item => (
            <div key={item.menuItemId} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-lg bg-brand text-white flex items-center justify-center text-[10px] font-black shrink-0">{item.quantity}</span>
              <span className="text-foreground">{item.menuItemName}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-700">
            📝 {order.notes}
          </div>
        )}

        {isNew   && <Button variant="dark"    className="w-full" size="sm" onClick={() => onStatus(order.id, "preparing")}><FireIcon className="w-3.5 h-3.5" />Start Cooking</Button>}
        {isPrep  && <Button variant="default" className="w-full" size="sm" onClick={() => onStatus(order.id, "ready")}><CheckCircleIcon className="w-3.5 h-3.5" />Mark Ready</Button>}
        {isReady && (
          <div className="w-full py-2 rounded-xl text-sm font-semibold text-center bg-green-50 text-green-700 border border-green-200">
            Ready for {order.orderType === "delivery" ? "Rider Pickup" : "Customer"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["confirmed", "preparing", "ready"])
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => toOrder(d.id, d.data() as Record<string, unknown>));
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setOrders(list);
      setLoading(false);
    }, (err) => {
      console.error("[KitchenDashboard]", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const counts = {
    confirmed: orders.filter(o => o.status === "confirmed").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready:     orders.filter(o => o.status === "ready").length,
  };

  async function handleStatus(id: string, status: OrderStatus) {
    try {
      await updateDoc(doc(db, "orders", id), { status, updatedAt: serverTimestamp() });

      // Send "order ready" email notification
      if (status === "ready") {
        try {
          const orderSnap = await getDoc(doc(db, "orders", id));
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const customerId: string = orderData.customerId ?? "";
            if (customerId && !customerId.startsWith("guest_")) {
              const userSnap = await getDoc(doc(db, "users", customerId));
              if (userSnap.exists()) {
                const email: string = userSnap.data().email ?? "";
                if (email) {
                  const fullOrder = toOrder(id, orderData as Record<string, unknown>);
                  sendOrderReadyNotification(fullOrder, email).catch((e) =>
                    console.error("[KitchenDashboard] email:", e)
                  );
                }
              }
            }
          }
        } catch (emailErr) {
          console.error("[KitchenDashboard] email lookup:", emailErr);
        }
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  }

  const STATS = [
    { key: "confirmed" as const, label: "New Orders", icon: <BellAlertIcon className="w-6 h-6" />, cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
    { key: "preparing" as const, label: "Cooking",    icon: <FireIcon      className="w-6 h-6" />, cls: "bg-brand/5 border-brand/20 text-brand" },
    { key: "ready"     as const, label: "Ready",      icon: <CheckCircleIcon className="w-6 h-6" />, cls: "bg-green-50 border-green-200 text-green-700" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-foreground">Kitchen Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage incoming food orders in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {STATS.map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={cn("p-4 rounded-2xl border-2 text-center transition-all hover:shadow-sm", s.cls, filter === s.key && "ring-2 ring-offset-1 ring-current/30 shadow-sm")}>
            <div className="mb-1">{s.icon}</div>
            <div className="font-display font-black text-2xl">{counts[s.key]}</div>
            <div className="text-xs font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(n => (
            <div key={n} className="rounded-2xl border border-border p-4 animate-pulse h-48 bg-muted/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <SparklesIcon className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="font-display font-bold text-xl text-foreground mb-2">
            {orders.length === 0 ? "No active orders" : "No orders in this status"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {orders.length === 0 ? "Orders will appear here automatically" : "Try switching the filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered
            .sort((a, b) => {
              const order: Record<string, number> = { confirmed: 0, preparing: 1, ready: 2 };
              return (order[a.status] ?? 3) - (order[b.status] ?? 3);
            })
            .map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} />)}
        </div>
      )}
    </div>
  );
}