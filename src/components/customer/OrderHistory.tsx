import React, { useEffect, useState } from "react";
import type { Order, OrderItem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { subscribeToUserOrders } from "@/lib/orderService";
import { formatCurrency, ORDER_STATUS_LABEL, ORDER_STATUS_CLASS, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ClockIcon,
  ReceiptRefundIcon,
  ArrowPathIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function OrderHistory({ onReorder }: { onReorder: () => void }) {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderMsg, setReorderMsg] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToUserOrders(
      user.uid,
      (o) => {
        // Sort most recent to oldest per diagram
        const sorted = [...o].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  function handleReorder(order: Order) {
    const added: string[] = [];
    const skipped: string[] = [];

    order.items.forEach((item: OrderItem) => {
      const menuItem = state.menuItems.find((m) => m.id === item.menuItemId);
      if (menuItem && menuItem.available) {
        dispatch({
          type: "ADD_TO_CART",
          payload: { menuItem, quantity: item.quantity },
        });
        added.push(item.menuItemName);
      } else {
        skipped.push(item.menuItemName);
      }
    });

    if (added.length > 0) {
      // Cart auto-repopulates, then open cart sidebar for checkout
      let msg = `${added.length} item${added.length > 1 ? "s" : ""} added to cart.`;
      if (skipped.length > 0)
        msg += ` (${skipped.join(", ")} unavailable — skipped)`;
      setReorderMsg(msg);
      setReorderError(null);
      setTimeout(() => setReorderMsg(null), 4000);
      onReorder(); // open cart sidebar → customer proceeds to checkout
    } else {
      setReorderError("All items from this order are currently unavailable.");
      setReorderMsg(null);
      setTimeout(() => setReorderError(null), 4000);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ReceiptRefundIcon className="w-5 h-5 text-brand" />
        <h2 className="font-display font-bold text-lg text-foreground">My Orders</h2>
        {orders.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({orders.length} order{orders.length !== 1 ? "s" : ""})
          </span>
        )}
      </div>

      {/* Reorder success toast */}
      {reorderMsg && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
          <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
          <div>
            <p className="font-semibold">Cart repopulated</p>
            <p className="text-xs mt-0.5">{reorderMsg}</p>
          </div>
        </div>
      )}

      {/* Reorder error toast */}
      {reorderError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <p>{reorderError}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="rounded-2xl border border-border p-4 animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-28" />
                <div className="h-4 bg-muted rounded w-20" />
              </div>
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-16">
          <InboxIcon className="w-14 h-14 text-muted mx-auto mb-3" />
          <h3 className="font-display font-bold text-foreground">No orders yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Place your first order from the menu!
          </p>
        </div>
      )}

      {/* Orders list — most recent first (sorted above) */}
      {!loading && orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Order header */}
          <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-border">
            <div>
              <p className="font-mono text-xs font-bold text-muted-foreground">
                {order.orderNumber}
              </p>
              <p className="font-display font-bold text-foreground text-sm mt-0.5">
                {formatCurrency(order.total)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <ClockIcon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                  ORDER_STATUS_CLASS[order.status]
                )}
              >
                {ORDER_STATUS_LABEL[order.status]}
              </span>
              <Badge variant="secondary" className="text-[10px] capitalize">
                {order.orderType}
              </Badge>
            </div>
          </div>

          {/* Items */}
          <div className="px-4 py-3 space-y-1">
            {order.items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {item.menuItemName}{" "}
                  <span className="font-semibold text-foreground">× {item.quantity}</span>
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Footer — Reorder button auto-repopulates cart, then opens checkout */}
          <div className="px-4 pb-4 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground capitalize">
              {order.paymentMethod === "cash"
                ? "Cash on Delivery"
                : order.paymentMethod.toUpperCase()}
            </span>
            <button
              onClick={() => handleReorder(order)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brand border border-brand/30 hover:bg-brand hover:text-white transition-all active:scale-95"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Reorder
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
