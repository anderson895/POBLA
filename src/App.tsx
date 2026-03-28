import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";
import Navbar from "@/components/shared/Navbar";
import AuthPage from "@/components/auth/AuthPage";
import CustomerMenu from "@/components/customer/CustomerMenu";
import CartSidebar from "@/components/customer/CartSidebar";
import KitchenDashboard from "@/components/kitchen/KitchenDashboard";
import DeliveryDashboard from "@/components/delivery/DeliveryDashboard";
import OwnerDashboard from "@/components/owner/OwnerDashboard";

function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#3b3130" }}>
      <svg className="animate-spin w-10 h-10 mb-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="#bc5d5d" strokeWidth="4"/>
        <path className="opacity-80" fill="#bc5d5d" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p className="text-sm font-semibold text-white/40">Loading Pobla Order Hub…</p>
    </div>
  );
}

function AppContent() {
  const { user, userRole, isGuest, authLoading } = useAuth();
  const { dispatch } = useApp();
  const [cartOpen, setCartOpen] = useState(false);

  // Sync Firestore role → AppContext currentRole so Navbar role switcher stays consistent
  useEffect(() => {
    if (userRole) {
      dispatch({ type: "SET_ROLE", payload: userRole });
    }
  }, [userRole, dispatch]);

  if (authLoading) return <AuthLoading />;
  if (!user && !isGuest) return <AuthPage />;

  // Guest — browse menu only
  if (isGuest && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onCartClick={() => {}} />
        <main><CustomerMenu onOpenCart={() => {}} /></main>
      </div>
    );
  }

  // Route based on Firestore role
  const role = userRole ?? "customer";

  const pages: Record<string, React.ReactNode> = {
    customer: <CustomerMenu onOpenCart={() => setCartOpen(true)} />,
    kitchen:  <KitchenDashboard />,
    delivery: <DeliveryDashboard />,
    owner:    <OwnerDashboard />,
    manager:  <OwnerDashboard />,
    staff:    <KitchenDashboard />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <main>{pages[role]}</main>
      {role === "customer" && (
        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
