export type UserRole =
  | "customer"
  | "kitchen"
  | "delivery"
  | "owner"
  | "staff"
  | "manager"
  | "cashier";

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

// Status flow:
// pending → confirmed (cashier) → preparing (kitchen) → ready
// → picked_up (rider) → out_for_delivery → delivered
// pickup path: ready → completed
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "completed"
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
  customerEmail?: string;
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
  assignedRiderPhone?: string;
  photoProofUrl?: string;
  estimatedReadyMinutes?: number;
  estimatedDeliveryMinutes?: number;
  confirmedAt?: Date;
  preparedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
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

export type RiderRegistrationStatus = "pending" | "approved" | "rejected";

export interface RiderRegistration {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: "motorcycle" | "bicycle" | "car";
  plateNumber: string;
  status: RiderRegistrationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
