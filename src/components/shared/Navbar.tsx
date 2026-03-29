import React, { useState, useEffect, useRef } from "react";
import AccountSettings from "@/components/shared/AccountSettings";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { Order, UserRole } from "@/types";
import {
  ShoppingCartIcon, UserIcon, TruckIcon, ChartBarIcon, BellIcon,
  ChevronDownIcon, FireIcon, ArrowRightStartOnRectangleIcon,
  LockClosedIcon, Cog6ToothIcon, CheckCircleIcon, ClockIcon,
  MapPinIcon, ExclamationCircleIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import { cn, formatCurrency } from "@/lib/utils";
import {
  subscribeToUserOrders,
  subscribeToPendingOrders,
  subscribeToKitchenOrders,
  subscribeToAvailableDeliveries,
  subscribeToRiderOrders,
  subscribeToAllOrders,
} from "@/lib/orderService";

const ROLE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  customer: { label:"Customer",          icon:<UserIcon className="w-4 h-4" /> },
  kitchen:  { label:"Kitchen Staff",     icon:<FireIcon className="w-4 h-4" /> },
  delivery: { label:"Delivery Rider",    icon:<TruckIcon className="w-4 h-4" /> },
  owner:    { label:"Owner / Manager",   icon:<ChartBarIcon className="w-4 h-4" /> },
};

interface Notif {
  id: string;
  title: string;
  body: string;
  time: Date;
  read: boolean;
  icon: "check" | "clock" | "truck" | "pin" | "alert";
}

function notifIcon(type: Notif["icon"]) {
  const cls = "w-4 h-4 shrink-0";
  if (type === "check") return <CheckCircleIcon className={cn(cls, "text-green-400")} />;
  if (type === "clock") return <ClockIcon       className={cn(cls, "text-amber-400")} />;
  if (type === "truck") return <TruckIcon        className={cn(cls, "text-indigo-400")} />;
  if (type === "pin")   return <MapPinIcon       className={cn(cls, "text-brand")} />;
  return                       <ExclamationCircleIcon className={cn(cls, "text-red-400")} />;
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/** Build notifications from orders depending on role */
function buildNotifs(role: string | null, orders: Order[], riderId?: string): Notif[] {
  const notifs: Notif[] = [];

  if (role === "customer") {
    orders.slice(0, 20).forEach(o => {
      if (o.status === "confirmed")
        notifs.push({ id:`${o.id}-confirmed`, title:"Order Confirmed", body:`${o.orderNumber} is confirmed and going to kitchen.`, time: o.confirmedAt ?? o.updatedAt, read:false, icon:"check" });
      if (o.status === "preparing")
        notifs.push({ id:`${o.id}-preparing`, title:"Order Being Prepared", body:`Kitchen is now preparing ${o.orderNumber}.`, time: o.updatedAt, read:false, icon:"clock" });
      if (o.status === "ready")
        notifs.push({ id:`${o.id}-ready`, title:"Order Ready", body:`${o.orderNumber} is ready${o.orderType === "pickup" ? " for pickup!" : " — waiting for rider."}`, time: o.updatedAt, read:false, icon:"check" });
      if (o.status === "picked_up")
        notifs.push({ id:`${o.id}-picked`, title:"Rider Picked Up", body:`${o.assignedRiderName ?? "Your rider"} picked up ${o.orderNumber}.`, time: o.pickedUpAt ?? o.updatedAt, read:false, icon:"truck" });
      if (o.status === "out_for_delivery")
        notifs.push({ id:`${o.id}-ofd`, title:"Out for Delivery", body:`${o.orderNumber} is on the way to you!`, time: o.updatedAt, read:false, icon:"pin" });
      if (o.status === "delivered")
        notifs.push({ id:`${o.id}-delivered`, title:"Order Delivered", body:`${o.orderNumber} has been delivered. Enjoy!`, time: o.deliveredAt ?? o.updatedAt, read:false, icon:"check" });
      if (o.status === "cancelled")
        notifs.push({ id:`${o.id}-cancelled`, title:"Order Cancelled", body:`${o.orderNumber} was cancelled.`, time: o.updatedAt, read:false, icon:"alert" });
    });
  }

  if (role === "kitchen") {
    orders.forEach(o => {
      if (o.status === "confirmed")
        notifs.push({ id:`${o.id}-confirmed`, title:"New Order to Prepare", body:`${o.orderNumber} — ${o.items.length} item(s) · ${formatCurrency(o.total)}`, time: o.confirmedAt ?? o.updatedAt, read:false, icon:"clock" });
    });
  }

  if (role === "delivery") {
    orders.forEach(o => {
      if (!o.assignedRiderId)
        notifs.push({ id:`${o.id}-avail`, title:"New Delivery Available", body:`${o.orderNumber} · ${o.customerName} · ${formatCurrency(o.total)}`, time: o.updatedAt, read:false, icon:"truck" });
    });
    // active orders for this rider
    if (riderId) {
      orders.filter(o => o.assignedRiderId === riderId).forEach(o => {
        if (o.status === "picked_up")
          notifs.push({ id:`${o.id}-picked`, title:"Order Picked Up", body:`You picked up ${o.orderNumber}. Head to ${o.customerAddress ?? "customer"}.`, time: o.pickedUpAt ?? o.updatedAt, read:false, icon:"pin" });
        if (o.status === "delivered")
          notifs.push({ id:`${o.id}-done`, title:"Delivery Complete", body:`${o.orderNumber} delivered successfully!`, time: o.deliveredAt ?? o.updatedAt, read:false, icon:"check" });
      });
    }
  }

  if (role === "owner") {
    const pending   = orders.filter(o => o.status === "pending").length;
    const cancelled = orders.filter(o => o.status === "cancelled");
    if (pending > 0)
      notifs.push({ id:"owner-pending", title:`${pending} Pending Order${pending > 1 ? "s" : ""}`, body:"Waiting for cashier confirmation.", time: new Date(), read:false, icon:"clock" });
    cancelled.slice(0, 5).forEach(o =>
      notifs.push({ id:`${o.id}-cancel`, title:"Order Cancelled", body:`${o.orderNumber} by ${o.customerName} was cancelled.`, time: o.updatedAt, read:false, icon:"alert" })
    );
    const recent = orders.filter(o => o.status === "delivered" || o.status === "completed").slice(0, 3);
    recent.forEach(o =>
      notifs.push({ id:`${o.id}-done`, title:"Order Fulfilled", body:`${o.orderNumber} · ${formatCurrency(o.total)}`, time: o.deliveredAt ?? o.updatedAt, read:false, icon:"check" })
    );
  }

  return notifs.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20);
}

export default function Navbar({ onCartClick, onLoginClick }: { onCartClick: () => void; onLoginClick?: () => void }) {
  const { state, cartItemCount } = useApp();
  const { user, userRole, isGuest, logout, exitGuest } = useAuth();
  const [userOpen,     setUserOpen]     = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bellOpen,     setBellOpen]     = useState(false);
  const [readIds,      setReadIds]      = useState<Set<string>>(new Set());
  const [orders,       setOrders]       = useState<Order[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  const roleMeta    = ROLE_META[userRole ?? state.currentRole] ?? ROLE_META["customer"];
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const riderId     = user?.uid;

  // Subscribe to relevant orders based on role
  useEffect(() => {
    if (!user || isGuest) return;
    const role = userRole ?? "customer";

    if (role === "customer")
      return subscribeToUserOrders(user.uid, setOrders);
    if (role === "kitchen")
      return subscribeToKitchenOrders(setOrders);
    if (role === "delivery") {
      // merge available + rider's active orders
      const unsub1 = subscribeToAvailableDeliveries(avail => {
        setOrders(prev => {
          const activeIds = new Set(prev.filter(o => o.assignedRiderId === riderId).map(o => o.id));
          const active = prev.filter(o => activeIds.has(o.id));
          return [...avail, ...active];
        });
      });
      const unsub2 = subscribeToRiderOrders(user.uid, active => {
        setOrders(prev => {
          const availIds = new Set(prev.filter(o => !o.assignedRiderId).map(o => o.id));
          const avail = prev.filter(o => availIds.has(o.id));
          return [...avail, ...active];
        });
      });
      return () => { unsub1(); unsub2(); };
    }
    if (role === "owner")
      return subscribeToAllOrders(setOrders);
  }, [user, userRole, isGuest]);

  // Build notifs
  const allNotifs = buildNotifs(userRole ?? "customer", orders, riderId);
  const notifs    = allNotifs.map(n => ({ ...n, read: readIds.has(n.id) }));
  const unread    = notifs.filter(n => !n.read).length;

  function openBell() {
    setBellOpen(v => !v);
  }

  function markAllRead() {
    setReadIds(new Set(notifs.map(n => n.id)));
  }

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]));
  }

  async function handleLogout() {
    setUserOpen(false);
    if (isGuest) { exitGuest(); return; }
    await logout();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background:"#3b3130" }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <img src="/logo.png" alt="Pobla logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <p className="font-display font-black text-sm leading-none tracking-tight text-white">POBLA</p>
              <p className="text-[10px] font-bold tracking-widest leading-none mt-0.5" style={{ color:"#bc5d5d" }}>ORDER HUB</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Notification Bell */}
            {user && !isGuest && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <BellIcon className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black bg-red-500 text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                    <div
                      className="absolute top-full right-0 mt-2 rounded-2xl shadow-2xl z-50 w-80 overflow-hidden"
                      style={{ background:"#2e2726", border:"1px solid rgba(188,93,93,0.2)" }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <BellIcon className="w-4 h-4 text-brand" />
                          <p className="text-sm font-bold text-white">Notifications</p>
                          {unread > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">{unread}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {unread > 0 && (
                            <button onClick={markAllRead} className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
                              Mark all read
                            </button>
                          )}
                          <button onClick={() => setBellOpen(false)} className="text-white/40 hover:text-white/70 transition-colors">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Notification list */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifs.length === 0 ? (
                          <div className="py-12 text-center">
                            <BellIcon className="w-10 h-10 text-white/10 mx-auto mb-2" />
                            <p className="text-sm text-white/30 font-semibold">No notifications yet</p>
                          </div>
                        ) : (
                          notifs.map(n => (
                            <button
                              key={n.id}
                              onClick={() => markRead(n.id)}
                              className={cn(
                                "w-full text-left flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all",
                                !n.read && "bg-white/[0.03]"
                              )}
                            >
                              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background:"rgba(188,93,93,0.15)" }}>
                                {notifIcon(n.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={cn("text-xs font-bold truncate", n.read ? "text-white/50" : "text-white")}>
                                    {n.title}
                                  </p>
                                  {!n.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-[10px] text-white/25 mt-1">{timeAgo(n.time)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cart — customers only */}
            {(userRole === "customer" || (!userRole && !isGuest)) && !isGuest && (
              <button onClick={onCartClick}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"style={{ background:"#bc5d5d" }}>
                <ShoppingCartIcon className="w-4 h-4" />
                <span className="hidden sm:inline font-display">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-white text-brand-dark">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Not logged in */}
            {!user && !isGuest && (
              <button onClick={onLoginClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: "#bc5d5d" }}>
                Login / Sign Up
              </button>
            )}

            {/* Guest */}
            {isGuest && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:flex items-center gap-1 text-xs text-white/40 font-semibold">
                  <LockClosedIcon className="w-3 h-3" /> Guest
                </span>
                <button onClick={exitGuest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all" style={{ background: "rgba(188,93,93,0.8)" }}>
                  Login to Order
                </button>
              </div>
            )}

            {/* User avatar dropdown */}
            {user && !isGuest && (
              <div className="relative">
                <button onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all hover:bg-white/5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"style={{ background:"#bc5d5d" }}>
                    {initials}
                  </div>
                  <span className="hidden sm:block text-xs font-semibold text-white/80 max-w-[80px] truncate">{displayName}</span>
                  <ChevronDownIcon className="w-3 h-3 text-white/40" />
                </button>

                {userOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 rounded-2xl shadow-2xl p-2 min-w-[180px] z-50"style={{ background:"#2e2726", border:"1px solid rgba(188,93,93,0.2)" }}>
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-sm font-bold text-white truncate">{displayName}</p>
                        <p className="text-[11px] text-white/40 truncate">{user.email}</p>
                        <p className="text-[10px] text-brand/60 mt-0.5 capitalize">{roleMeta.label}</p>
                      </div>
                      <button onClick={() => { setUserOpen(false); setSettingsOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/5 transition-all">
                        <Cog6ToothIcon className="w-4 h-4" /> Settings
                      </button>
                      <div className="h-px mx-2 my-1" style={{ background:"rgba(255,255,255,0.06)" }} />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                        <ArrowRightStartOnRectangleIcon className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <AccountSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}