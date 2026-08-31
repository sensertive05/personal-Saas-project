export type OrderStatus = "pending" | "confirmed" | "shipped" | "completed" | "cancelled";

export interface Order {
  id: string;
  guest_id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}
