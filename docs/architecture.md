# 아키텍처 개요

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript |
| 서버 상태 | TanStack Query |
| 클라이언트 상태 | Zustand |
| 스타일 | Tailwind CSS, shadcn/ui |
| 백엔드 / DB | Supabase (PostgreSQL) |
| 분석 | GA4, Microsoft Clarity |
| 배포 | Vercel (Frontend), Supabase (DB) |

## 폴더 구조

```
src/
├── app/                  # Next.js App Router 라우트
│   ├── layout.tsx        # 루트 레이아웃, QueryProvider + SiteHeader 마운트
│   ├── page.tsx          # 랜딩 페이지
│   ├── products/         # 상품 조회 페이지
│   ├── cart/             # 장바구니 페이지
│   ├── orders/           # 주문 내역(목록) / 주문 상세([id]) 페이지
│   └── admin/
│       ├── login/        # 관리자 로그인 페이지
│       ├── products/     # 관리자: 상품 등록 페이지
│       ├── inventory/    # 관리자: 재고 관리 페이지
│       ├── orders/       # 관리자: 주문 관리 페이지
│       └── dashboard/    # 관리자: 매출 대시보드 페이지
├── components/
│   ├── ui/                # shadcn/ui 기반 프리미티브 컴포넌트
│   └── layout/site-header.tsx  # 공통 헤더 (네비게이션 + 장바구니 배지)
├── lib/
│   ├── supabase/client.ts  # Supabase 브라우저 클라이언트 (쿠키 세션, 환경변수 없으면 null)
│   ├── queries/           # TanStack Query에서 사용하는 데이터 fetch 함수
│   ├── guest-id.ts        # 비로그인 주문 식별용 guest_id(localStorage) 유틸
│   └── order-status.ts    # 주문 상태 코드 → 한글 라벨 매핑
├── providers/             # 전역 Provider (QueryClientProvider 등)
├── stores/                # Zustand 스토어 (product-filter-store, cart-store 등)
└── types/                 # 도메인 타입 정의
src/proxy.ts               # /admin/* 라우트 인증 보호 (Next.js 16의 middleware.ts 후속)
supabase/
└── schema.sql             # DB 스키마, RLS 정책, create_order 함수, 샘플 데이터
```

## 데이터 흐름

1. UI 컴포넌트가 TanStack Query의 `useQuery`로 `src/lib/queries/*`의 함수를 호출한다.
2. 쿼리 함수는 `src/lib/supabase/client.ts`의 Supabase 클라이언트로 PostgreSQL에 접근한다.
3. Supabase 환경변수가 설정되지 않은 경우 클라이언트는 `null`이 되며, 화면은 "Supabase 연결 필요" 안내를 표시한다 (더미 데이터로 감추지 않는다).
4. 여러 화면에서 공유해야 하는 클라이언트 상태(검색어, 필터, 장바구니 등)는 Zustand 스토어(`src/stores/*`)로 관리한다.
5. 장바구니(`src/stores/cart-store.ts`)는 로그인 기능이 없는 현재 단계에서 `persist` 미들웨어로 브라우저 `localStorage`에 저장된다.
6. 주문 생성은 클라이언트에서 여러 쿼리를 순차 실행하지 않고, Supabase Postgres 함수 `create_order(guest_id, items)`를 RPC로 한 번에 호출한다. 이 함수가 재고 확인·차감, `orders`/`order_items` insert를 하나의 트랜잭션으로 원자적으로 처리한다 (`supabase/schema.sql` 참고).
7. 로그인이 없으므로 주문은 브라우저별 `guest_id`(`src/lib/guest-id.ts`, localStorage에 저장된 UUID)로 식별하고, 주문 내역 조회도 이 값으로 필터링한다.
8. 관리자 상품 등록(`/admin/products`)은 `createProduct`(`src/lib/queries/products.ts`)로 `products` 테이블에 직접 insert한다. `products`의 insert RLS 정책이 `authenticated` role로 제한되어 있어(13번 참고) 로그인한 관리자만 성공한다.
9. 관리자 재고 관리(`/admin/inventory`)는 `updateProductStock`(`src/lib/queries/products.ts`)으로 Postgres 함수 `update_product_stock(product_id, stock_quantity)`를 RPC 호출한다. `products` 테이블에는 직접 update 권한을 열지 않고, 재고 수량만 수정 가능한 이 함수만 노출해 다른 컬럼(가격 등)이 바뀌지 않도록 한다. `/products`, `/admin/products`와 동일한 `["products"]` 쿼리 키를 공유하므로, 재고를 수정하면 다른 화면의 캐시도 함께 무효화되어 최신 값으로 갱신된다.
10. 관리자 주문 관리(`/admin/orders`)는 `getAllOrders`(`src/lib/queries/orders.ts`)로 `guest_id` 필터 없이 전체 주문을 조회한다. 상태 변경은 `updateOrderStatus`가 Postgres 함수 `update_order_status(order_id, status)`를 RPC 호출한다. `orders` 테이블에는 select만 공개로 열려 있고(`update_product_stock`과 동일한 이유로, permissive한 update 정책은 `guest_id`/`total_amount` 등 다른 컬럼까지 열어버리므로 제거했다), status 변경은 이 함수를 통해서만 가능하다. 고객용 `/orders` 페이지의 `guest_id` 스코프 `["orders"]` 쿼리와 캐시가 섞이지 않도록 `["admin-orders"]`라는 별도 쿼리 키를 사용한다.
11. 관리자 상품 수정/삭제(`/admin/products`)는 `updateProduct`/`deleteProduct`(`src/lib/queries/products.ts`)로 Postgres 함수 `update_product`/`delete_product`를 RPC 호출한다. `update_product_stock`과 동일한 이유로 `products` 테이블에 직접 update/delete 정책을 열지 않고 이 함수들만 노출한다. `delete_product`는 `order_items`에 해당 상품을 참조하는 행이 있는지 사전에 확인해, FK 제약 위반 에러 대신 "주문 내역이 있어 삭제할 수 없습니다"라는 한글 메시지를 던진다.

12. 관리자 매출 대시보드(`/admin/dashboard`)는 `getAllOrders`(`["admin-orders"]` 쿼리 키 공유)와 신규 `getAllOrderItems`(`["admin-order-items"]`)를 조회해, DB 집계 없이 클라이언트에서 `computeDashboardMetrics`(`src/lib/dashboard-metrics.ts`)로 총 매출/총 주문 수/최근 14일 일별 매출/인기 상품 TOP 5를 계산한다. `cancelled` 주문은 실현된 매출이 아니므로 모든 집계에서 제외한다. 현재 데이터 규모(수십~수백 건)에서는 DB 쪽 GROUP BY/RPC 없이도 충분하다고 판단했다. 매출 추이 차트는 신규 설치한 `recharts`로 그린다.
13. 관리자 인증(Supabase Auth)은 두 겹으로 방어한다. (1) `src/proxy.ts`(Next.js 16에서 `middleware.ts`를 대체하는 파일 규칙)가 `/admin/:path*` 요청마다 쿠키의 세션을 확인해, 로그인하지 않은 사용자는 `/admin/login`으로, 이미 로그인한 사용자가 `/admin/login`에 접근하면 `/admin/products`로 리다이렉트한다 — 이는 UX 차원의 optimistic 체크일 뿐이다. (2) 실제 데이터 변경은 `update_product`/`delete_product`/`update_product_stock`/`update_order_status` 함수 내부의 `auth.uid() is null` 체크와, `products` insert RLS 정책의 `to authenticated` 제약이 막는다 — proxy를 우회해도 이 두 번째 방어선은 항상 적용된다. Supabase 세션은 `@supabase/ssr`의 `createBrowserClient`로 (localStorage 대신) 쿠키에 저장해, 브라우저와 proxy(서버)가 같은 로그인 상태를 공유한다. 관리자 계정은 공개 가입 없이 Supabase 대시보드에서 수동으로 생성한다.

## 다음 단계 (MVP 로드맵)

- GA4 이벤트(`view_item`, `add_to_cart`, `begin_checkout`, `purchase`) 계측 및 퍼널 분석
