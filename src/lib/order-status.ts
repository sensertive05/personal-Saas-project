import type { OrderStatus } from "@/types/order";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "주문 접수",
  confirmed: "주문 확인",
  shipped: "배송 중",
  completed: "완료",
  cancelled: "취소됨",
};

export function orderStatusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status;
}
