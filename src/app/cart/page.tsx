"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createOrder } from "@/lib/queries/orders";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clear);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = useMutation({
    mutationFn: () => createOrder(items),
    onSuccess: (orderId) => {
      clearCart();
      router.push(`/orders/${orderId}`);
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">장바구니</h1>
        <p className="text-muted-foreground text-sm">
          담은 상품을 확인하고 수량을 조절하세요.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>장바구니가 비었습니다</CardTitle>
            <CardDescription>
              상품 조회 페이지에서 원하는 상품을 담아보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/products">상품 조회하러 가기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-center">수량</TableHead>
                    <TableHead className="text-right">소계</TableHead>
                    <TableHead className="text-right">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(item.price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-7"
                            aria-label={`${item.name} 수량 감소`}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              setQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="size-7"
                            aria-label={`${item.name} 수량 증가`}
                            disabled={item.quantity >= item.stockQuantity}
                            onClick={() =>
                              setQuantity(item.productId, item.quantity + 1)
                            }
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(item.price * item.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">삭제</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  총 {totalQuantity}개
                </div>
                <div className="text-lg font-semibold">
                  {currencyFormatter.format(totalPrice)}
                </div>
              </div>

              {!isSupabaseConfigured && (
                <p className="text-muted-foreground text-sm">
                  Supabase 연결이 필요합니다. 연결 후 주문할 수 있습니다.
                </p>
              )}

              {placeOrder.isError && (
                <p className="text-destructive text-sm">
                  {placeOrder.error instanceof Error
                    ? placeOrder.error.message
                    : "주문에 실패했습니다."}
                </p>
              )}

              <Button
                className="self-end"
                disabled={!isSupabaseConfigured || placeOrder.isPending}
                onClick={() => placeOrder.mutate()}
              >
                {placeOrder.isPending ? "주문 처리 중..." : "주문하기"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
