import React, { useState, useEffect } from "react";
import type { Order, OrderItem, OrderType } from "@/types";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { saveOrder } from "@/lib/orderService";
import { sendOrderConfirmation } from "@/lib/emailService";
import { formatCurrency, generateOrderNumber, PAYMENT_LABEL, FREE_DELIVERY_THRESHOLD, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCartIcon, XMarkIcon, TrashIcon, PlusIcon, MinusIcon,
  TruckIcon, BuildingStorefrontIcon, ArrowLeftIcon, CheckCircleIcon,
  BanknotesIcon, HomeIcon, PhoneIcon, UserIcon,
} from "@heroicons/react/24/outline";

type Step = "cart" | "delivery" | "confirm" | "receipt";

const STEPS: Step[] = ["cart", "delivery", "confirm"];
const STEP_LABEL: Record<Step, string> = { cart: "Cart", delivery: "Delivery", confirm: "Confirm", receipt: "Receipt" };
const PREV: Partial<Record<Step, Step>> = { delivery: "cart", confirm: "delivery" };

function StepBar({ step }: { step: Step }) {
  if (step === "receipt") return null;
  const current = STEPS.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4 border-b border-border">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all",
              i < current  ? "bg-brand border-brand text-white" :
              i === current ? "border-brand text-brand bg-brand/5" :
                             "border-border text-muted-foreground"
            )}>
              {i < current ? <CheckCircleIcon className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn("text-[10px] font-semibold hidden sm:inline", i <= current ? "text-brand" : "text-muted-foreground")}>
              {STEP_LABEL[s]}
            </span>
          </div>
          {i < STEPS.length - 1 && <div className={cn("h-px w-6 transition-all", i < current ? "bg-brand" : "bg-border")} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CartSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, cartSubtotal, cartDeliveryFee, cartTotal } = useApp();
  const { user } = useAuth();

  const [step, setStep]       = useState<Step>("cart");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes]     = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder]     = useState<Order | null>(null);

  // Pre-fill user's name from Firebase auth
  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  const { cart } = state;

  function reset() { setStep("cart"); setOrder(null); }
  function handleClose() { onClose(); if (step === "receipt") setTimeout(reset, 300); }

  async function placeOrder() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const items: OrderItem[] = cart.items.map((ci) => ({
      menuItemId:   ci.menuItem.id,
      menuItemName: ci.menuItem.name,
      quantity:     ci.quantity,
      unitPrice:    ci.menuItem.price,
      subtotal:     ci.menuItem.price * ci.quantity,
      ...(ci.notes ? { notes: ci.notes } : {}),
    }));

    const newOrder: Order = {
      id:              `order_${Date.now()}`,
      orderNumber:     generateOrderNumber(),
      customerId:      user?.uid ?? `guest_${Date.now()}`,
      customerName:    name || user?.displayName || "Customer",
      customerPhone:   phone,
      ...(address ? { customerAddress: address } : {}),
      items,
      status:          "confirmed",
      orderType:       cart.orderType,
      paymentMethod:   cart.paymentMethod,
      paymentStatus:   "pending",
      subtotal:        cartSubtotal,
      deliveryFee:     cartDeliveryFee,
      total:           cartTotal,
      ...(notes ? { notes } : {}),
      createdAt:       new Date(),
      updatedAt:       new Date(),
    };

    // Save to Firestore if user is logged in
    if (user) {
      try {
        const firestoreId = await saveOrder(newOrder, user.uid);
        newOrder.id = firestoreId;
      } catch (err) {
        console.error("[CartSidebar] saveOrder:", err);
      }
      // Send confirmation email (fire-and-forget)
      if (user.email) {
        sendOrderConfirmation(newOrder, user.email).catch((e) =>
          console.error("[CartSidebar] email:", e)
        );
      }
    }

    dispatch({ type: "ADD_ORDER", payload: newOrder });
    dispatch({ type: "CLEAR_CART" });
    setOrder(newOrder);
    setLoading(false);
    setStep("receipt");
  }

  if (!open) return null;



  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-brand-dark/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {(step !== "cart" && step !== "receipt") && (
              <button onClick={() => setStep(PREV[step]!)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground mr-1">
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
            )}
            <ShoppingCartIcon className="w-5 h-5 text-brand" />
            <h2 className="font-display font-bold text-foreground">
              {step === "cart" ? "Your Cart" : step === "delivery" ? "Delivery Info" :
               step === "confirm" ? "Confirm Order" : "Order Placed!"}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <StepBar step={step} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* CART */}
          {step === "cart" && (
            <div className="p-4 space-y-4">
              {cart.items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCartIcon className="w-16 h-16 text-muted mx-auto mb-3" />
                  <h3 className="font-display font-bold text-foreground mb-1">Cart is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add items from the menu first</p>
                  <Button variant="outline" size="sm" onClick={handleClose}>Browse Menu</Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 p-1 bg-muted rounded-xl">
                    {([
                      { v: "delivery", label: "Delivery", icon: <TruckIcon className="w-4 h-4" /> },
                      { v: "pickup",   label: "Pickup",   icon: <BuildingStorefrontIcon className="w-4 h-4" /> },
                    ] as { v: OrderType; label: string; icon: React.ReactNode }[]).map((o) => (
                      <button key={o.v}
                        onClick={() => dispatch({ type: "SET_ORDER_TYPE", payload: o.v })}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
                          cart.orderType === o.v ? "bg-white text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}>
                        {o.icon}{o.label}
                      </button>
                    ))}
                  </div>

                  {cart.items.map((ci) => (
                    <div key={ci.menuItem.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{ci.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(ci.menuItem.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => dispatch({ type: "UPDATE_CART_ITEM", payload: { menuItemId: ci.menuItem.id, quantity: ci.quantity - 1 } })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-border text-muted-foreground hover:text-brand hover:border-brand/30 transition-all">
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-foreground min-w-[16px] text-center">{ci.quantity}</span>
                        <button onClick={() => dispatch({ type: "UPDATE_CART_ITEM", payload: { menuItemId: ci.menuItem.id, quantity: ci.quantity + 1 } })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand text-white hover:bg-brand/90 transition-all">
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-brand w-16 text-right shrink-0">{formatCurrency(ci.menuItem.price * ci.quantity)}</p>
                      <button onClick={() => dispatch({ type: "REMOVE_FROM_CART", payload: ci.menuItem.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {cart.orderType === "delivery" && (
                    <div className={cn("rounded-xl p-3 text-xs font-medium",
                      cartSubtotal >= FREE_DELIVERY_THRESHOLD ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700")}>
                      {cartSubtotal >= FREE_DELIVERY_THRESHOLD
                        ? "You qualify for free delivery!"
                        : `Add ${formatCurrency(FREE_DELIVERY_THRESHOLD - cartSubtotal)} more for free delivery`}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DELIVERY INFO */}
          {step === "delivery" && (
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Juan dela Cruz" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="tel" placeholder="09XX XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
                </div>
              </div>
              {cart.orderType === "delivery" && (
                <div className="space-y-1.5">
                  <Label>Delivery Address</Label>
                  <div className="relative">
                    <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Block/Lot, Street, Barangay, City" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Special Instructions (optional)</Label>
                <Textarea placeholder="Notes for kitchen or rider..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
            </div>
          )}


          {/* CONFIRM */}
          {step === "confirm" && (
            <div className="p-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs font-medium text-yellow-700">
                Review your order before placing it.
              </div>
              <div className="space-y-2">
                <Label>Order Items</Label>
                {cart.items.map((ci) => (
                  <div key={ci.menuItem.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ci.menuItem.name} × {ci.quantity}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(ci.menuItem.price * ci.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                {name    && <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span></div>}
                {phone   && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>}
                {address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium text-right max-w-[55%]">{address}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{cart.orderType}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium">{PAYMENT_LABEL[cart.paymentMethod]}</span></div>
              </div>
            </div>
          )}

          {/* RECEIPT */}
          {step === "receipt" && order && (
            <div className="p-4 space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircleIcon className="w-9 h-9 text-green-600" />
                </div>
                <h3 className="font-display font-black text-xl text-foreground">Order Placed!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your order is being prepared</p>
              </div>

              <div className="bg-muted/40 rounded-2xl p-4 border border-dashed border-border space-y-3 font-mono">
                <div className="text-center pb-3 border-b border-dashed border-border">
                  <img src="/logo.png" alt="Pobla logo" className="w-10 h-10 rounded-xl object-cover mx-auto mb-1" />
                  <p className="font-display font-black text-foreground">POBLA ORDER HUB</p>
                  <p className="text-[11px] text-muted-foreground">Official Receipt</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Order #</span><span className="font-bold text-foreground">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Date</span><span>{order.createdAt.toLocaleDateString("en-PH")}</span>
                </div>
                <Separator />
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.menuItemName} ×{item.quantity}</span>
                    <span className="text-foreground">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Delivery fee</span><span>{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t border-dashed border-border pt-2">
                  <span className="font-display">TOTAL</span>
                  <span className="text-brand">{formatCurrency(order.total)}</span>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-1">Salamat sa inyong order!</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                <p className="font-semibold mb-0.5 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" /> Sent to kitchen
                </p>
                <p>Kitchen staff has been notified to prepare your order.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(cart.items.length > 0 || step === "receipt") && (
          <div className="p-4 border-t border-border space-y-3 bg-white">
            {step !== "receipt" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span>{formatCurrency(cartSubtotal)}</span>
                </div>
                {cart.orderType === "delivery" && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery fee</span>
                    <span>{cartDeliveryFee === 0
                      ? <span className="text-green-600 font-semibold">FREE</span>
                      : formatCurrency(cartDeliveryFee)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-display font-black text-base">
                  <span>Total</span><span className="text-brand">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            )}
            {step === "cart"     && <Button className="w-full" onClick={() => setStep("delivery")} disabled={cart.items.length === 0}>Continue to Delivery Info</Button>}
            {step === "delivery" && <Button className="w-full" onClick={() => setStep("confirm")} disabled={!name || !phone || (cart.orderType === "delivery" && !address)}>Review Order</Button>}
            {step === "confirm"  && (
              <Button className="w-full" size="lg" onClick={placeOrder} disabled={loading}>
                {loading ? "Placing Order..." : `Place Order • ${formatCurrency(cartTotal)}`}
              </Button>
            )}
            {step === "receipt"  && <Button variant="outline" className="w-full" onClick={handleClose}>Back to Menu</Button>}
          </div>
        )}
      </div>
    </div>
  );
}