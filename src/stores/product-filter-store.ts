import { create } from "zustand";

interface ProductFilterState {
  search: string;
  category: string | null;
  setSearch: (search: string) => void;
  setCategory: (category: string | null) => void;
  reset: () => void;
}

export const useProductFilterStore = create<ProductFilterState>((set) => ({
  search: "",
  category: null,
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  reset: () => set({ search: "", category: null }),
}));
