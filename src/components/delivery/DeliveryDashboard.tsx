import React, { useState, useEffect } from "react";
import type { Order } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPinIcon, PhoneIcon, CheckCircleIcon, TruckIcon, BanknotesIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function toOrder(id: string, data: Record<string, unknown>): Order {
  return {
    ...(data as Omit<Order, "id" | "createdAt" | "updatedAt">),
    id,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

function DeliveryCard({ order, riderId, riderName, onAccept, onDeliver }: {
  order: Order;
  riderId: string;
  riderName: string;
  onAccept: (id: string) => void;
  onDeliver: (id: string) => void;
}) {
  const isAvail  = order.status === "ready" && !order.assignedRiderId;
  const isActive = order.status === "out_for_delivery" && order.assignedRiderId === riderId;
  const isDone   = order.status === "delivered";
  const mins     = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isActive && "ring-2 ring-brand/30 border-brand/40",
      isAvail  && "ring-2 ring-yellow-400/40 border-yellow-300",
    )}>
      <div className={cn("h-1.5", isActive ? "bg-brand" : isAvail ? "bg-yellow-400" : "bg-green-500")} />
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display font-black text-sm text-foreground">{order.orderNumber}</p>
            <Badge
              variant={isActive ? "default" : isAvail ? "warning" : "success"}
              className="text-[10px] mt-1"
            >
              {isActive ? "Out for Delivery" : isAvail ? "Ready for Pickup" : "Delivered"}
            </Badge>
          </div>
          <div className="text-right">
            <p className="font-display font-black text-brand">{formatCurrency(order.total)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{mins < 1 ? "Just now" : `${mins}m ago`}</p>
          </div>
        </div>

        {/* Customer info */}
        <div className="p-3 bg-muted/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-black text-sm shrink-0">
              {order.customerName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
            </div>
            <a
              href={`tel:${order.customerPhone}`}
              className="p-1.5 rounded-lg bg-white border border-border text-green-600 hover:bg-green-50 transition-all"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
            </a>
          </div>
          {order.customerAddress && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
              {order.customerAddress}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-0.5">
          {order.items.map(item => (
            <div key={item.menuItemId} className="flex justify-between text-xs text-muted-foreground">
              <span>{item.menuItemName} ×{item.quantity}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        {/* Cash to collect */}
        <div className="flex items-center gap-2 text-xs font-semibold p-2 rounded-lg bg-green-50 text-green-700">
          <BanknotesIcon className="w-4 h-4" />
          Collect {formatCurrency(order.total)} — Cash on Delivery
        </div>

        {/* Actions */}
        {isAvail  && (
          <Button variant="dark" className="w-full" size="sm" onClick={() => onAccept(order.id)}>
            <TruckIcon className="w-4 h-4" /> Accept Delivery
          </Button>
        )}
        {isActive && (
          <Button variant="default" className="w-full" size="sm" onClick={() => onDeliver(order.id)}>
            <CheckCircleIcon className="w-4 h-4" /> Mark as Delivered
          </Button>
        )}
        {isDone && (
          <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckBadgeIcon className="w-4 h-4" /> Delivered
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const riderId   = user?.uid ?? "";
  const riderName = user?.displayName || user?.email?.split("@")[0] || "Rider";

  const [avail,   setAvail]   = useState<Order[]>([]);
  const [mine,    setMine]    = useState<Order[]>([]);
  const [done,    setDone]    = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!riderId) return;

    // Available: ready delivery orders not yet assigned to anyone
    const q1 = query(
      collection(db, "orders"),
      where("status",    "==", "ready"),
      where("orderType", "==", "delivery")
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      const list = snap.docs
        .map(d => toOrder(d.id, d.data() as Record<string, unknown>))
        .filter(o => !o.assignedRiderId); // exclude already-assigned
      setAvail(list);
      setLoading(false);
    }, (err) => {
      console.error("[DeliveryDashboard] avail:", err);
      setLoading(false);
    });

    // My active deliveries
    const q2 = query(
      collection(db, "orders"),
      where("assignedRiderId", "==", riderId),
      where("status",          "==", "out_for_delivery")
    );
    const unsub2 = onSnapshot(q2, (snap) => {
      setMine(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)));
    });

    // My completed deliveries
    const q3 = query(
      collection(db, "orders"),
      where("assignedRiderId", "==", riderId),
      where("status",          "==", "delivered")
    );
    const unsub3 = onSnapshot(q3, (snap) => {
      setDone(snap.docs.map(d => toOrder(d.id, d.data() as Record<string, unknown>)));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [riderId]);

  async function handleAccept(id: string) {
    try {
      await updateDoc(doc(db, "orders", id), {
        status:            "out_for_delivery",
        assignedRiderId:   riderId,
        assignedRiderName: riderName,
        updatedAt:         serverTimestamp(),
      });
    } catch (err) {
      console.error("[DeliveryDashboard] accept:", err);
    }
  }

  async function handleDeliver(id: string) {
    try {
      await updateDoc(doc(db, "orders", id), {
        status:        "delivered",
        paymentStatus: "paid",
        updatedAt:     serverTimestamp(),
      });
    } catch (err) {
      console.error("[DeliveryDashboard] deliver:", err);
    }
  }

  const TABS = [
    { key: "available", label: "Available",     list: avail, badge: avail.length, empty: "No available deliveries. Orders appear here when the kitchen marks them ready." },
    { key: "mine",      label: "My Deliveries", list: mine,  badge: mine.length,  empty: "No active deliveries. Accept one from the Available tab." },
    { key: "done",      label: "Completed",     list: done,  badge: 0,            empty: "No completed deliveries yet." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-foreground">Delivery Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Hello, <strong>{riderName}</strong>! Here are your deliveries.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Available",  val: avail.length, cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { label: "Active",     val: mine.length,  cls: "bg-brand/5 border-brand/20 text-brand" },
          { label: "Completed",  val: done.length,  cls: "bg-green-50 border-green-200 text-green-700" },
        ].map(s => (
          <div key={s.label} className={cn("p-4 rounded-2xl border text-center", s.cls)}>
            <p className="font-display font-black text-2xl">{s.val}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="available">
        <TabsList className="mb-5 w-full">
          {TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="flex-1">
              {t.label}
              {t.badge > 0 && (
                <span className="ml-1.5 text-xs font-black text-brand">{t.badge}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(tab => (
          <TabsContent key={tab.key} value={tab.key}>
            {loading && tab.key === "available" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map(n => (
                  <div key={n} className="rounded-2xl border border-border p-4 animate-pulse h-52 bg-muted/30" />
                ))}
              </div>
            ) : tab.list.length === 0 ? (
              <div className="text-center py-16">
                <TruckIcon className="w-14 h-14 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{tab.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tab.list.map(o => (
                  <DeliveryCard
                    key={o.id}
                    order={o}
                    riderId={riderId}
                    riderName={riderName}
                    onAccept={handleAccept}
                    onDeliver={handleDeliver}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}