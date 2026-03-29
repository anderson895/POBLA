import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MenuItem, OrderStatus, PaymentMethod, PaymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PB-${ts}-${rand}`;
}

export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_THRESHOLD = 500;

export function calcDeliveryFee(subtotal: number, type: string): number {
  if (type === "pickup") return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:          "Pending",
  confirmed:        "Confirmed",
  preparing:        "Preparing",
  ready:            "Ready",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending:          "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed:        "bg-blue-100 text-blue-800 border-blue-200",
  preparing:        "bg-orange-100 text-orange-800 border-orange-200",
  ready:            "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered:        "bg-green-100 text-green-800 border-green-200",
  cancelled:        "bg-red-100 text-red-800 border-red-200",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash:  "Cash on Delivery",
  gcash: "GCash",
  maya:  "Maya",
  card:  "Credit/Debit Card",
};

export const DEMO_MENU: MenuItem[] = [
  {
    id: "m1", name: "Pares Rice Meal",
    description: "Tender braised beef with rich broth, served with steamed rice",
    price: 120, category: "Rice Meals", available: true, preparationTime: 10,
    tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m2", name: "Tapsilog",
    description: "Beef tapa, garlic fried rice, and sunny-side-up egg",
    price: 110, category: "Rice Meals", available: true, preparationTime: 12,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m3", name: "Bangsilog",
    description: "Crispy boneless bangus, garlic rice, and egg",
    price: 115, category: "Rice Meals", available: true, preparationTime: 12,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m4", name: "Pares (Solo)",
    description: "Tender braised beef with savory broth — no rice",
    price: 75, category: "Ala Carte", available: true, preparationTime: 8,
    tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m5", name: "Extra Rice",
    description: "Steamed jasmine rice per cup",
    price: 20, category: "Ala Carte", available: true, preparationTime: 3,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m6", name: "Tokwa't Baboy",
    description: "Crispy tofu and pork ears in spiced vinegar sauce",
    price: 65, category: "Ala Carte", available: true, preparationTime: 10,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m7", name: "Pobla Special Pares",
    description: "Extra tender beef with our secret house broth, served overflowing",
    price: 185, category: "Pobla Specials", available: true, preparationTime: 12,
    tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m8", name: "Pobla Tower Burger",
    description: "Double beef patty, lettuce, tomato, special sauce, brioche bun",
    price: 165, category: "Burgers", available: true, preparationTime: 15,
    tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m9", name: "Classic Smash Burger",
    description: "Smashed beef patty, American cheese, pickles, mustard",
    price: 135, category: "Burgers", available: true, preparationTime: 12,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m10", name: "Chicken Burger",
    description: "Crispy fried chicken fillet, coleslaw, spicy mayo",
    price: 125, category: "Burgers", available: true, preparationTime: 12,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m11", name: "Club Sandwich",
    description: "Triple-decker with chicken, bacon, egg, lettuce, tomato",
    price: 120, category: "Sandwiches", available: true, preparationTime: 10,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m12", name: "BLT Sandwich",
    description: "Bacon, lettuce, tomato on toasted sourdough",
    price: 105, category: "Sandwiches", available: true, preparationTime: 8,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m13", name: "Pobla Iced Chiller",
    description: "Blended fruit chiller with real milk and crushed ice — ask for flavor",
    price: 75, category: "Chillers", available: true, preparationTime: 5,
    tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m14", name: "Mango Graham Chiller",
    description: "Fresh mango, graham crackers, cream, and crushed ice",
    price: 85, category: "Chillers", available: true, preparationTime: 5,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: "m15", name: "Ube Chiller",
    description: "Creamy ube blend with milk and tapioca pearls",
    price: 85, category: "Chillers", available: true, preparationTime: 5,
    tags: [], createdAt: new Date(), updatedAt: new Date(),
  },
];
