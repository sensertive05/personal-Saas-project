import { getGuestId } from "@/lib/guest-id";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { CartItem } from "@/stores/cart-store";
import type { Order, OrderItem, OrderStatus, OrderWithItems } from "@/types/order";

export async function createOrder(items: CartItem[]): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const guestId = getGuestId();

  const { data, error } = await supabase.rpc("create_order", {
    guest_id: guestId,
    items: items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const guestId = getGuestId();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrder(orderId: string): Promise<OrderWithItems> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }

  return data as OrderWithItems;
}

export async function getAllOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getAllOrderItems(): Promise<OrderItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase.from("order_items").select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase.rpc("update_order_status", {
    order_id: orderId,
    status,
  });

  if (error) {
    throw error;
  }

  return data as Order;
}
