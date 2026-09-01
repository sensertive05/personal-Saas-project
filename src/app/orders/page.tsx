"use client";

import Link from "next/link";
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
import { getOrders } from "@/lib/queries/orders";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { orderStatusLabel } from "@/lib/order-status";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function OrdersPage() {
  const {
    data: orders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: isSupabaseConfigured,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">주문 내역</h1>
        <p className="text-muted-foreground text-sm">
          이 브라우저에서 진행한 주문의 상태를 확인하세요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase 연결이 필요합니다</CardTitle>
            <CardDescription>
              연결 후 주문 내역이 이곳에 표시됩니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isSupabaseConfigured && isError && (
        <Card>
          <CardHeader>
            <CardTitle>주문 내역을 불러오지 못했습니다</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && orders && orders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>주문 내역이 없습니다</CardTitle>
            <CardDescription>
              상품을 담아 주문하면 이곳에 표시됩니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && orders && orders.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문일시</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">총액</TableHead>
                  <TableHead className="text-right">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{dateFormatter.format(new Date(order.created_at))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{orderStatusLabel(order.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {currencyFormatter.format(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        보기
                      </Link>
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
