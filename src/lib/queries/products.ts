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

export async function updateProduct(
  id: string,
  product: NewProduct
): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase.rpc("update_product", {
    product_id: id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock_quantity: product.stock_quantity,
    category: product.category,
    image_url: product.image_url,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase.rpc("delete_product", {
    product_id: id,
  });

  if (error) {
    throw error;
  }
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
