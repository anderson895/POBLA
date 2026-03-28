import React, { useState } from "react";
import type { Order } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPinIcon, PhoneIcon, CheckCircleIcon, TruckIcon, BanknotesIcon, CreditCardIcon } from "@heroicons/react/24/outline";

const RIDER_ID   = "rider_001";
const RIDER_NAME = "Kuya Mark";

function DeliveryCard({ order, onAccept, onDeliver }: {
  order: Order; onAccept: (id: string) => void; onDeliver: (id: string) => void;
}) {
  const isAvail   = order.status === "ready" && !order.assignedRiderId;
  const isActive  = order.status === "out_for_delivery" && order.assignedRiderId === RIDER_ID;
  const isDone    = order.status === "delivered";

  return (
    <Card className={cn(isActive && "ring-2 ring-brand/30 border-brand/40")}>
      <div className={cn("h-1.5", isActive ? "bg-brand" : isAvail ? "bg-yellow-400" : "bg-green-500")} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display font-black text-sm text-foreground">{order.orderNumber}</p>
            <Badge variant={isActive ? "default" : isAvail ? "warning" : "success"} className="text-[10px] mt-1">
              {isActive ? "Out for Delivery" : isAvail ? "Ready for Pickup" : "Delivered"}
            </Badge>
          </div>
          <p className="font-display font-black text-brand">{formatCurrency(order.total)}</p>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-black text-sm shrink-0">
              {order.customerName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{order.customerName}</p>
              <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
            </div>
            <a href={`tel:${order.customerPhone}`}
              className="p-1.5 rounded-lg bg-white border border-border text-green-600 hover:bg-green-50 transition-all">
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

        <div className="space-y-0.5">
          {order.items.map(item => (
            <div key={item.menuItemId} className="flex justify-between text-xs text-muted-foreground">
              <span>{item.menuItemName} ×{item.quantity}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className={cn("flex items-center gap-2 text-xs font-semibold p-2 rounded-lg", order.paymentMethod === "cash" ? "bg-green-50 text-green-700" : "bg-brand/5 text-brand")}>
          {order.paymentMethod === "cash" ? <BanknotesIcon className="w-4 h-4" /> : <CreditCardIcon className="w-4 h-4" />}
          {order.paymentMethod === "cash" ? `Collect ${formatCurrency(order.total)} cash` : "Payment already made"}
        </div>

        {isAvail  && <Button variant="dark"    className="w-full" size="sm" onClick={() => onAccept(order.id)}><TruckIcon className="w-4 h-4" />Accept Delivery</Button>}
        {isActive && <Button variant="default" className="w-full" size="sm" onClick={() => onDeliver(order.id)}><CheckCircleIcon className="w-4 h-4" />Mark as Delivered</Button>}
        {isDone   && <div className="w-full py-2 rounded-xl text-sm font-semibold text-center bg-green-50 text-green-700 border border-green-200">✅ Delivered</div>}
      </CardContent>
    </Card>
  );
}

export default function DeliveryDashboard() {
  const { state, dispatch } = useApp();

  const avail = state.orders.filter(o => o.status === "ready" && o.orderType === "delivery" && !o.assignedRiderId);
  const mine  = state.orders.filter(o => o.assignedRiderId === RIDER_ID && o.status === "out_for_delivery");
  const done  = state.orders.filter(o => o.assignedRiderId === RIDER_ID && o.status === "delivered");

  function handleAccept(id: string) {
    const o = state.orders.find(o => o.id === id);
    if (!o) return;
    dispatch({ type: "UPDATE_ORDER", payload: { ...o, status: "out_for_delivery", assignedRiderId: RIDER_ID, assignedRiderName: RIDER_NAME, updatedAt: new Date() } });
  }
  function handleDeliver(id: string) {
    const o = state.orders.find(o => o.id === id);
    if (!o) return;
    dispatch({ type: "UPDATE_ORDER", payload: { ...o, status: "delivered", paymentStatus: "paid", updatedAt: new Date() } });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="font-display font-bold text-xl text-foreground">Delivery Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Hello, {RIDER_NAME}! Manage your deliveries here.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Active",     val: mine.length,                     cls: "bg-brand/5 border-brand/20 text-brand" },
          { label: "Completed",  val: done.length,                     cls: "bg-green-50 border-green-200 text-green-700" },
          { label: "Tips Today", val: formatCurrency(done.length * 49), cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
        ].map(s => (
          <div key={s.label} className={cn("p-4 rounded-2xl border text-center", s.cls)}>
            <p className="font-display font-black text-xl">{s.val}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="available">
        <TabsList className="mb-5 w-full">
          <TabsTrigger value="available" className="flex-1">
            Available {avail.length > 0 && <span className="ml-1.5 text-xs font-black text-brand">{avail.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">
            My Deliveries {mine.length > 0 && <span className="ml-1.5 text-xs font-black text-brand">{mine.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="done" className="flex-1">Completed</TabsTrigger>
        </TabsList>

        {[
          { key: "available", list: avail, empty: "No available deliveries. Orders appear here when kitchen marks them ready." },
          { key: "mine",      list: mine,  empty: "No active deliveries. Accept one from the Available tab." },
          { key: "done",      list: done,  empty: "No completed deliveries yet." },
        ].map(tab => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.list.length === 0 ? (
              <div className="text-center py-16">
                <TruckIcon className="w-14 h-14 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{tab.empty}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tab.list.map(o => <DeliveryCard key={o.id} order={o} onAccept={handleAccept} onDeliver={handleDeliver} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
