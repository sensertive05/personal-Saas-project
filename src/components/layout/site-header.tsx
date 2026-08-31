"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";

export function SiteHeader() {
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-8 py-4">
        <Link href="/" className="font-semibold">
          재고관리 SaaS
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="text-muted-foreground hover:text-foreground">
            상품 조회
          </Link>
          <Link href="/orders" className="text-muted-foreground hover:text-foreground">
            주문내역
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1.5">
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-2 -top-2 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
              >
                {itemCount}
              </Badge>
            )}
            <span className="sr-only">장바구니</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
