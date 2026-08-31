"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts } from "@/lib/queries/products";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function ProductsPage() {
  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: isSupabaseConfigured,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">상품 조회</h1>
        <p className="text-muted-foreground text-sm">
          등록된 상품 목록을 확인하세요.
        </p>
      </div>

      {!isSupabaseConfigured && <SupabaseNotConfiguredNotice />}

      {isSupabaseConfigured && isLoading && <ProductListSkeleton />}

      {isSupabaseConfigured && isError && (
        <Card>
          <CardHeader>
            <CardTitle>상품 목록을 불러오지 못했습니다</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && products && products.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>등록된 상품이 없습니다</CardTitle>
            <CardDescription>
              관리자 화면에서 상품을 등록하면 이곳에 표시됩니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && products && products.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">가격</TableHead>
                  <TableHead className="text-right">재고</TableHead>
                  <TableHead className="text-right">담기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {currencyFormatter.format(product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.stock_quantity <= 0 ? (
                        <Badge variant="destructive">품절</Badge>
                      ) : (
                        product.stock_quantity
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AddToCartButton product={product} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={outOfStock}
      onClick={() => {
        addItem(product);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1000);
      }}
    >
      {outOfStock ? "품절" : justAdded ? "담았습니다" : "담기"}
    </Button>
  );
}

function ProductListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function SupabaseNotConfiguredNotice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase 연결이 필요합니다</CardTitle>
        <CardDescription>
          <code className="rounded bg-muted px-1 py-0.5">.env.local</code>에
          {" "}
          <code className="rounded bg-muted px-1 py-0.5">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          {" / "}
          <code className="rounded bg-muted px-1 py-0.5">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          를 설정한 뒤 <code className="rounded bg-muted px-1 py-0.5">supabase/schema.sql</code>을
          실행해 상품 테이블을 생성하면 이 화면에 상품 목록이 표시됩니다.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
