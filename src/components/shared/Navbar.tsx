import React, { useState } from "react";
import AccountSettings from "@/components/shared/AccountSettings";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import {
  ShoppingCartIcon, UserIcon, TruckIcon, ChartBarIcon, BellIcon,
  ChevronDownIcon, FireIcon, ArrowRightStartOnRectangleIcon,
  LockClosedIcon, Cog6ToothIcon, ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const ROLE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  customer: { label:"Customer",          icon:<UserIcon className="w-4 h-4" /> },
  kitchen:  { label:"Kitchen Staff",     icon:<FireIcon className="w-4 h-4" /> },
  delivery: { label:"Delivery Rider",    icon:<TruckIcon className="w-4 h-4" /> },
  owner:    { label:"Owner / Manager",   icon:<ChartBarIcon className="w-4 h-4" /> },
};

export default function Navbar({ onCartClick, onLoginClick }: { onCartClick: () => void; onLoginClick?: () => void }) {
  const { state, cartItemCount } = useApp();
  const { user, userRole, isGuest, logout, exitGuest } = useAuth();
  const [userOpen, setUserOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const roleMeta = ROLE_META[userRole ?? state.currentRole] ?? ROLE_META["customer"];
  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

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

          {/* Role badge — static, no dropdown (role is set by Firestore) */}
          {/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white/80"style={{ background:"rgba(188,93,93,0.12)", border:"1px solid rgba(188,93,93,0.3)" }}>
            <span style={{ color:"#bc5d5d" }}>{roleMeta.icon}</span>
            <span className="hidden sm:inline">{roleMeta.label}</span>
          </div> */}

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl text-white/40 hover:text-white/70 transition-colors">
              <BellIcon className="w-5 h-5" />
            </button>

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

            {/* Not logged in — show Login button */}
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