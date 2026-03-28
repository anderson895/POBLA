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
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-orange-100 text-orange-800 border-orange-200",
  ready: "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash on Delivery",
  gcash: "GCash",
  maya: "Maya",
  card: "Credit/Debit Card",
};

export const DEMO_MENU: MenuItem[] = [
  { id: "m1",  name: "Crispy Lumpia",      description: "Deep-fried spring rolls with pork and vegetables",                    price: 89,  category: "Appetizers",  available: true,  preparationTime: 10, tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m2",  name: "Sinigang na Baboy",  description: "Tamarind-based pork soup with fresh vegetables",                     price: 195, category: "Main Course", available: true,  preparationTime: 25, tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date() },
  { id: "m3",  name: "Lechon Kawali",      description: "Crispy deep-fried pork belly served with liver sauce",               price: 235, category: "Main Course", available: true,  preparationTime: 20, tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date() },
  { id: "m4",  name: "Chicken Inasal",     description: "Grilled marinated chicken with calamansi and annatto",               price: 175, category: "Main Course", available: true,  preparationTime: 20, tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m5",  name: "Palabok",            description: "Rice noodles with shrimp sauce topped with chicharon",              price: 145, category: "Main Course", available: false, preparationTime: 15, tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m6",  name: "Halo-Halo",          description: "Mixed shaved ice with sweet beans, fruits, leche flan and ube",    price: 115, category: "Desserts",    available: true,  preparationTime: 8,  tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m7",  name: "Leche Flan",         description: "Classic Filipino caramel custard",                                  price: 75,  category: "Desserts",    available: true,  preparationTime: 5,  tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m8",  name: "Calamansi Juice",    description: "Fresh-squeezed calamansi with honey",                               price: 55,  category: "Beverages",   available: true,  preparationTime: 3,  tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m9",  name: "Iced Tea",           description: "House-brewed sweetened iced tea",                                   price: 45,  category: "Beverages",   available: true,  preparationTime: 2,  tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m10", name: "Steamed Rice",       description: "Premium jasmine rice per cup",                                      price: 35,  category: "Sides",       available: true,  preparationTime: 5,  tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m11", name: "Garlic Rice",        description: "Fried rice with roasted garlic",                                    price: 45,  category: "Sides",       available: true,  preparationTime: 7,  tags: [],             createdAt: new Date(), updatedAt: new Date() },
  { id: "m12", name: "Kare-Kare",          description: "Oxtail stew in peanut sauce with banana blossom and bagoong",      price: 285, category: "Specials",    available: true,  preparationTime: 30, tags: ["bestseller"], createdAt: new Date(), updatedAt: new Date() },
];
