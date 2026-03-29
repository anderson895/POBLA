export type UserRole = "customer" | "kitchen" | "delivery" | "owner" | "staff" | "manager";

export type MenuCategory =
  | "Rice Meals"
  | "Ala Carte"
  | "Pobla Specials"
  | "Burgers"
  | "Sandwiches"
  | "Chillers";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  available: boolean;
  preparationTime: number;
  tags: string[];
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "gcash" | "maya" | "card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderType = "delivery" | "pickup";

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  assignedRiderId?: string;
  assignedRiderName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  orderType: OrderType;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
}
