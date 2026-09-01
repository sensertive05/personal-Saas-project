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
