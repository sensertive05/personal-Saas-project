import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Product } from "@/types/product";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  stockQuantity: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

function clampQuantity(quantity: number, stockQuantity: number) {
  return Math.min(Math.max(quantity, 1), Math.max(stockQuantity, 1));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      quantity: clampQuantity(
                        item.quantity + quantity,
                        product.stock_quantity
                      ),
                    }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                stockQuantity: product.stock_quantity,
                quantity: clampQuantity(quantity, product.stock_quantity),
              },
            ],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clampQuantity(quantity, item.stockQuantity) }
              : item
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "cart-storage" }
  )
);
