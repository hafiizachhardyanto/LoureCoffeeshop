export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  lastLoginAt: string;
  createdBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  isVerified?: boolean;
  sessionToken?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stock: number;
  rating: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "waiting" | "processing" | "completed" | "cancelled";
  paymentMethod: "qris" | "manual";
  paymentStatus: "pending" | "success" | "failed";
  midtransToken?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  processedBy?: string;
}

export interface AdminLog {
  id: string;
  action: "create" | "delete" | "update";
  targetType: "admin" | "menu" | "order";
  targetId: string;
  targetName: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details?: string;
}

export interface CartItem extends OrderItem {
  menuItem: MenuItem;
}

export type ViewMode = "grid" | "list";

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "rating" | "name";
  sortOrder?: "asc" | "desc";
}

export interface DailyReport {
  date: string;
  orders: number;
  revenue: number;
  items: number;
}

export interface MonthlyReport {
  month: string;
  orders: number;
  revenue: number;
  items: number;
}

export type ReportData = DailyReport | MonthlyReport;