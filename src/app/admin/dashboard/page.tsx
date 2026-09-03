"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import { computeDashboardMetrics } from "@/lib/dashboard-metrics";
import { getAllOrderItems, getAllOrders } from "@/lib/queries/orders";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function AdminDashboardPage() {
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrders,
    enabled: isSupabaseConfigured,
  });
  const orderItemsQuery = useQuery({
    queryKey: ["admin-order-items"],
    queryFn: getAllOrderItems,
    enabled: isSupabaseConfigured,
  });

  const isLoading = ordersQuery.isLoading || orderItemsQuery.isLoading;
  const isError = ordersQuery.isError || orderItemsQuery.isError;
  const error = ordersQuery.error ?? orderItemsQuery.error;
  const orders = ordersQuery.data;
  const orderItems = orderItemsQuery.data;

  const metrics = useMemo(() => {
    if (!orders || !orderItems) return null;
    return computeDashboardMetrics(orders, orderItems);
  }, [orders, orderItems]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">매출 대시보드</h1>
        <p className="text-muted-foreground text-sm">
          최근 매출 추이와 인기 상품을 확인하세요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase 연결이 필요합니다</CardTitle>
            <CardDescription>
              연결 후 매출 데이터를 확인할 수 있습니다.
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
            <CardTitle>매출 데이터를 불러오지 못했습니다</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && metrics && orders && orders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>주문이 없습니다</CardTitle>
            <CardDescription>
              주문이 생성되면 매출 데이터가 표시됩니다.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && metrics && orders && orders.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardDescription>총 매출</CardDescription>
                <CardTitle className="text-2xl">
                  {currencyFormatter.format(metrics.totalRevenue)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>총 주문 수</CardDescription>
                <CardTitle className="text-2xl">{metrics.orderCount}건</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>최근 14일 매출 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(v: number) => currencyFormatter.format(v)}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value: unknown) => currencyFormatter.format(Number(value))}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>인기 상품 TOP 5</CardTitle>
              <CardDescription>매출 기준</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead className="text-right">판매 수량</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.topProducts.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell>{p.productName}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">
                        {currencyFormatter.format(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
