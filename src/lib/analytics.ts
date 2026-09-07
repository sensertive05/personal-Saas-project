// GA4 이벤트 전송 유틸. window.gtag가 없으면(스크립트 미로드/개발 환경) 조용히 무시한다
// — Supabase 미연결 시 화면에 안내만 띄우고 조용히 넘어가는 이 프로젝트의 기존 패턴과 동일하다.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
}

function sendEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackViewItem(item: AnalyticsItem) {
  sendEvent("view_item", {
    currency: "KRW",
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(item: AnalyticsItem) {
  sendEvent("add_to_cart", {
    currency: "KRW",
    value: item.price * (item.quantity ?? 1),
    items: [item],
  });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number) {
  sendEvent("begin_checkout", {
    currency: "KRW",
    value,
    items,
  });
}

export function trackPurchase(
  orderId: string,
  items: AnalyticsItem[],
  value: number
) {
  sendEvent("purchase", {
    transaction_id: orderId,
    currency: "KRW",
    value,
    items,
  });
}
