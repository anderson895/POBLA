export type UserRole = "customer" | "kitchen" | "delivery" | "owner" | "staff" | "manager";

export type MenuCategory =
  | "Appetizers"
  | "Main Course"
  | "Desserts"
  | "Beverages"
  | "Sides"
  | "Specials";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  available: boolean;
  preparationTime: number;
  tags: string[];
  imageUrl?: string;       // Cloudinary secure_url
  imagePublicId?: string;  // Cloudinary public_id
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
