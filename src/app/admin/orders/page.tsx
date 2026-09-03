"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllOrders, updateOrderStatus } from "@/lib/queries/orders";
import { orderStatusLabel } from "@/lib/order-status";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/order";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "completed",
  "cancelled",
];

const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminOrdersPage() {
  const {
    data: orders,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrders,
    enabled: isSupabaseConfigured,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">주문 관리</h1>
        <p className="text-muted-foreground text-sm">
          전체 주문을 확인하고 상태를 변경하세요.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Supabase 연결이 필요합니다</CardTitle>
            <CardDescription>
              연결 후 주문을 관리할 수 있습니다.
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
            <CardTitle>주문 목록을 불러오지 못했습니다</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isSupabaseConfigured && orders && orders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>주문이 없습니다</CardTitle>
            <CardDescription>
              고객이 주문을 생성하면 이곳에 표시됩니다.
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
                  <TableHead>주문 ID</TableHead>
                  <TableHead>주문일시</TableHead>
                  <TableHead>고객</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead className="text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

function OrderRow({ order }: { order: Order }) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(order.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
      <TableCell>{dateFormatter.format(new Date(order.created_at))}</TableCell>
      <TableCell className="font-mono text-xs">{order.guest_id.slice(0, 8)}</TableCell>
      <TableCell className="text-right">
        {currencyFormatter.format(order.total_amount)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {updateStatusMutation.isError && (
            <span className="text-destructive text-xs">저장 실패</span>
          )}
          <Select
            className="w-32"
            value={order.status}
            disabled={updateStatusMutation.isPending}
            onChange={(e) =>
              updateStatusMutation.mutate(e.target.value as OrderStatus)
            }
            aria-label={`주문 ${order.id.slice(0, 8)} 상태`}
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabel(status)}
              </option>
            ))}
          </Select>
        </div>
      </TableCell>
    </TableRow>
  );
}
