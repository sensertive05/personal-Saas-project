import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export interface NewProduct {
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category: string | null;
  image_url: string | null;
}

export async function createProduct(product: NewProduct): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProductStock(
  id: string,
  stock_quantity: number
): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase.rpc("update_product_stock", {
    product_id: id,
    stock_quantity,
  });

  if (error) {
    throw error;
  }

  return data;
}
