"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts, updateProductStock } from "@/lib/queries/products";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function AdminInventoryPage() {
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
        <h1 className="text-2xl font-semibold">재고 관리</h1>
        <p className="text-muted-foreground text-sm">
          상품별 재고 수량을 확인하고 수정하세요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase 연결이 필요합니다</CardTitle>
            <CardDescription>
              연결 후 재고를 수정할 수 있습니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isSupabaseConfigured && isError && (
        <Card>
          <CardHeader>
            <CardTitle>재고 목록을 불러오지 못했습니다</CardTitle>
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
              상품 등록 화면에서 상품을 먼저 등록하세요.
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
                  <TableHead className="text-right">재고 수량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <InventoryRow key={product.id} product={product} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function InventoryRow({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(String(product.stock_quantity));

  const updateStockMutation = useMutation({
    mutationFn: (stockQuantity: number) =>
      updateProductStock(product.id, stockQuantity),
    onSuccess: (updated) => {
      setDraft(String(updated.stock_quantity));
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const draftValue = Number(draft);
  const isDraftValid =
    draft.trim().length > 0 &&
    Number.isInteger(draftValue) &&
    draftValue >= 0;
  const isDirty = isDraftValid && draftValue !== product.stock_quantity;

  const adjust = (delta: number) => {
    const base = isDraftValid ? draftValue : product.stock_quantity;
    const next = Math.max(base + delta, 0);
    setDraft(String(next));
    updateStockMutation.mutate(next);
  };

  return (
    <TableRow>
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
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {!isDraftValid && (
            <span className="text-destructive text-xs">0 이상 정수만 가능</span>
          )}
          {isDraftValid && updateStockMutation.isError && (
            <span className="text-destructive text-xs">저장 실패</span>
          )}
          <Button
            size="icon"
            variant="outline"
            className="size-7"
            aria-label={`${product.name} 재고 1 감소`}
            disabled={
              (isDraftValid ? draftValue : product.stock_quantity) <= 0 ||
              updateStockMutation.isPending
            }
            onClick={() => adjust(-1)}
          >
            <Minus className="size-3.5" />
          </Button>
          <Input
            type="number"
            min="0"
            step="1"
            className="w-20 text-right"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (isDirty) {
                updateStockMutation.mutate(draftValue);
              }
            }}
            aria-label={`${product.name} 재고 수량`}
          />
          <Button
            size="icon"
            variant="outline"
            className="size-7"
            aria-label={`${product.name} 재고 1 증가`}
            disabled={updateStockMutation.isPending}
            onClick={() => adjust(1)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
