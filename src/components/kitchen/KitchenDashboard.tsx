import React, { useState, useEffect } from "react";
import type { Order, OrderStatus } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, ClockIcon, BellAlertIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subscribeToKitchenOrders, updateOrderStatus } from "@/lib/orderService";
import { sendOrderReadyNotification } from "@/lib/emailService";

function OrderCard({ order, onStatus }: { order: Order; onStatus: (id: string, s: OrderStatus) => void }) {
  const isConfirmed = order.status === "confirmed";
  const isPreparing = order.status === "preparing";
  const isReady     = order.status === "ready";
  const mins        = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isConfirmed && "ring-2 ring-yellow-400/40 border-yellow-300",
      isPreparing && "ring-2 ring-brand/30 border-brand/40",
      isReady     && "ring-2 ring-green-400/30 border-green-300",
    )}>
      <div className={cn("h-1.5", isConfirmed ? "bg-yellow-400" : isPreparing ? "bg-brand" : "bg-green-500")} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            {isConfirmed && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1 mb-1.5 animate-pulse">
                <BellAlertIcon className="w-3 h-3" /> NEW — Start Cooking
              </Badge>
            )}
            <p className="font-display font-black text-sm text-foreground">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.customerName} ·{" "}
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

        {/* Items with per-item notes */}
        <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl mb-3">
          {order.items.map(item => (
            <div key={item.menuItemId}>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-lg bg-brand text-white flex items-center justify-center text-[10px] font-black shrink-0">{item.quantity}</span>
                <span className="text-foreground">{item.menuItemName}</span>
              </div>
              {item.notes && (
                <p className="text-xs text-amber-600 italic ml-7">→ {item.notes}</p>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3 text-xs text-amber-700">
             {order.notes}
          </div>
        )}

        {/* ETA info */}
        {order.estimatedReadyMinutes && (
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
          Target ready in {order.estimatedReadyMinutes}m from order time
          </div>
        )}

        {isConfirmed && (
          <Button variant="dark" className="w-full" size="sm" onClick={() => onStatus(order.id, "preparing")}>
            <FireIcon className="w-3.5 h-3.5" /> Start Cooking
          </Button>
        )}
        {isPreparing && (
          <Button variant="default" className="w-full" size="sm" onClick={() => onStatus(order.id, "ready")}>
            <CheckCircleIcon className="w-3.5 h-3.5" /> Mark Ready
          </Button>
        )}
        {isReady && (
          <div className="w-full py-2 rounded-xl text-sm font-semibold text-center bg-green-50 text-green-700 border border-green-200">
           Ready — {order.orderType === "delivery" ? "Awaiting rider" : "Awaiting customer"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KitchenDashboard() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<OrderStatus | "all">("all");

  // Only shows confirmed, preparing, ready — NOT pending (cashier handles those)
  useEffect(() => {
    const unsub = subscribeToKitchenOrders(o => { setOrders(o); setLoading(false); });
    return unsub;
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const counts   = {
    confirmed: orders.filter(o => o.status === "confirmed").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready:     orders.filter(o => o.status === "ready").length,
  };

  async function handleStatus(id: string, status: OrderStatus) {
    // When marking ready, send email notification
    if (status === "ready") {
      try {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) {
          const data = snap.data();
          const email = data.customerEmail as string | undefined;
          const order = {
            ...data,
            id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
            updatedAt: new Date(),
          } as Order;
          if (email) sendOrderReadyNotification(order, email).catch(console.error);
        }
      } catch { /* non-blocking */ }
    }
    await updateOrderStatus(id, status);
  }

  const STATS = [
    { key:"confirmed" as const, label:"Queue",    emoji:"", cls:"bg-yellow-50 border-yellow-200 text-yellow-700" },
    { key:"preparing" as const, label:"Cooking",  emoji:"", cls:"bg-brand/5 border-brand/20 text-brand" },
    { key:"ready"as const, label:"Ready",    emoji:"", cls:"bg-green-50 border-green-200 text-green-700" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-foreground">Kitchen Display System</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Orders confirmed by cashier appear here for preparation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {STATS.map(s => (
          <button key={s.key} onClick={() => setFilter(filter === s.key ? "all" : s.key)}
            className={cn(
              "p-4 rounded-2xl border-2 text-center transition-all hover:shadow-sm",
              s.cls,
              filter === s.key && "ring-2 ring-offset-1 ring-current/30 shadow-sm"
            )}>
            
            <div className="font-display font-black text-2xl">{counts[s.key]}</div>
            <div className="text-xs font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4"></p>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">
            {orders.length === 0 ? "No active orders" : "No orders in this filter"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {orders.length === 0 ? "Confirmed orders will appear here automatically" : "Try a different filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered
            .sort((a,b) => (({confirmed:0,preparing:1,ready:2} as Record<string,number>)[a.status]??3)-(({confirmed:0,preparing:1,ready:2} as Record<string,number>)[b.status]??3))
            .map(o => <OrderCard key={o.id} order={o} onStatus={handleStatus} />)}
        </div>
      )}
    </div>
  );
}