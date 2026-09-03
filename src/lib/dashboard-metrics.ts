import type { Order, OrderItem } from "@/types/order";

const REVENUE_WINDOW_DAYS = 14;
const TOP_PRODUCTS_LIMIT = 5;

export interface DailyRevenuePoint {
  date: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  orderCount: number;
  dailyRevenue: DailyRevenuePoint[];
  topProducts: TopProduct[];
}

function isRevenueOrder(order: Order): boolean {
  return order.status !== "cancelled";
}

export function computeDashboardMetrics(
  orders: Order[],
  orderItems: OrderItem[]
): DashboardMetrics {
  const revenueOrders = orders.filter(isRevenueOrder);
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const orderCount = revenueOrders.length;

  return {
    totalRevenue,
    orderCount,
    dailyRevenue: buildDailyRevenue(revenueOrders),
    topProducts: buildTopProducts(orders, orderItems),
  };
}

function buildDailyRevenue(revenueOrders: Order[]): DailyRevenuePoint[] {
  const days: DailyRevenuePoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = REVENUE_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    days.push({ date, label, revenue: 0, orderCount: 0 });
  }

  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const order of revenueOrders) {
    const bucket = byDate.get(order.created_at.slice(0, 10));
    if (bucket) {
      bucket.revenue += order.total_amount;
      bucket.orderCount += 1;
    }
  }

  return days;
}

function buildTopProducts(orders: Order[], orderItems: OrderItem[]): TopProduct[] {
  const revenueOrderIds = new Set(orders.filter(isRevenueOrder).map((o) => o.id));

  const totals = new Map<string, TopProduct>();
  for (const item of orderItems) {
    if (!revenueOrderIds.has(item.order_id)) continue;

    const revenue = item.unit_price * item.quantity;
    const existing = totals.get(item.product_id);
    if (existing) {
      existing.revenue += revenue;
      existing.quantity += item.quantity;
    } else {
      totals.set(item.product_id, {
        productId: item.product_id,
        productName: item.product_name,
        revenue,
        quantity: item.quantity,
      });
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_PRODUCTS_LIMIT);
}
