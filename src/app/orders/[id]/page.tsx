"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
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
import { getOrder } from "@/lib/queries/orders";
import { orderStatusLabel } from "@/lib/order-status";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: isSupabaseConfigured,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">주문 상세</h1>
        <p className="text-muted-foreground text-sm">
          주문 정보와 상태를 확인하세요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase 연결이 필요합니다</CardTitle>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isSupabaseConfigured && isError && (
        <Card>
          <CardHeader>
            <CardTitle>주문을 불러오지 못했습니다</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && order && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>주문번호 {order.id}</CardTitle>
                <CardDescription>
                  {dateFormatter.format(new Date(order.created_at))}
                </CardDescription>
              </div>
              <Badge variant="secondary">{orderStatusLabel(order.status)}</Badge>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                    <TableHead className="text-right">소계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(item.unit_price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">총 결제 금액</span>
              <span className="text-lg font-semibold">
                {currencyFormatter.format(order.total_amount)}
              </span>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
