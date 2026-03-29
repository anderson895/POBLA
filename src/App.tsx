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
import CashierDashboard from "@/components/cashier/CashierDashboard";

function AuthLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background:"#3b3130" }}>
      <svg className="animate-spin w-10 h-10 mb-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="#bc5d5d" strokeWidth="4"/>
        <path className="opacity-80" fill="#bc5d5d" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p className="text-sm font-semibold text-white/40">Loading Pobla Order Hub…</p>
    </div>
  );
}

function RejectedPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background:"#3b3130" }}>
      <div className="text-center max-w-sm">
        
        <h2 className="font-display font-black text-2xl text-white mb-2">Registration Rejected</h2>
        <p className="text-white/50 text-sm mb-6">
        Your rider registration was not approved. Please contact the restaurant owner for more details.
        </p>
        <button onClick={logout}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"style={{ background:"#bc5d5d" }}>
        Sign Out
        </button>
      </div>
    </div>
  );
}

function PendingApprovalPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background:"#3b3130" }}>
      <div className="text-center max-w-sm">
        
        <h2 className="font-display font-black text-2xl text-white mb-2">Pending Approval</h2>
        <p className="text-white/50 text-sm mb-6">
        Your rider registration is being reviewed by the admin. You'll receive access once approved.
          Please check back later.
        </p>
        <button onClick={logout}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"style={{ background:"rgba(188,93,93,0.5)" }}>
        Sign Out
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, userRole, isGuest, authLoading } = useAuth();
  const { dispatch } = useApp();
  const [cartOpen, setCartOpen] = useState(false);

  // Sync Firestore role → AppContext
  useEffect(() => {
    if (userRole) dispatch({ type: "SET_ROLE", payload: userRole as any });
  }, [userRole, dispatch]);

  if (authLoading) return <AuthLoading />;
  if (!user && !isGuest) return <AuthPage />;

  // Handle special pending/rejected states
  if (userRole === "delivery_pending" as any) return <PendingApprovalPage />;
  if (userRole === "rejected" as any) return <RejectedPage />;

  // Guest — browse menu only (Diagram 4)
  if (isGuest && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onCartClick={() => {}} />
        <main><CustomerMenu onOpenCart={() => {}} /></main>
      </div>
    );
  }

  const role = userRole ?? "customer";

  // Diagram 1: Cashier role handles pending orders confirmation
  // Diagram 3: Delivery role handles rider flow
  const pages: Record<string, React.ReactNode> = {
    customer: <CustomerMenu onOpenCart={() => setCartOpen(true)} />,
    kitchen:  <KitchenDashboard />,
    delivery: <DeliveryDashboard />,
    owner:    <OwnerDashboard />,
    manager:  <OwnerDashboard />,
    staff:    <KitchenDashboard />,
    cashier:  <CashierDashboard />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setCartOpen(true)} />
      <main>{pages[role] ?? <CustomerMenu onOpenCart={() => setCartOpen(true)} />}</main>
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
