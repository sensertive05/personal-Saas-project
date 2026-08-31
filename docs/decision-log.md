# 의사결정 기록

## 2026-08-31 — 프로젝트 뼈대 및 상품 조회 MVP

- **인증 범위 제외**: 이번 단계에서는 로그인/인증을 구현하지 않는다. 상품 조회는 비로그인 상태에서도 가능해야 하므로, `products` 테이블 RLS 정책을 "누구나 조회 가능"으로 설정했다. 관리자 인증 및 쓰기 권한 제어는 다음 단계에서 다룬다.
- **Supabase 미연결 상태 처리**: Supabase 프로젝트가 아직 없는 상태로 개발을 시작했다. 목업 데이터로 화면을 숨기지 않고, 환경변수가 없으면 명시적으로 "Supabase 연결 필요" 안내를 보여주도록 했다. 이렇게 하면 실제 연결 시 별도 코드 수정 없이 바로 동작한다.
- **shadcn/ui 컴포넌트 직접 작성**: 네트워크 정책상 `ui.shadcn.com` 레지스트리에 접근할 수 없어 CLI(`shadcn add`)를 사용하지 못했다. 대신 표준 shadcn/ui 컴포넌트 코드(button, card, table, skeleton, badge)를 직접 작성했다. 추후 네트워크가 허용되는 환경에서 `npx shadcn@latest add <component>`로 다른 컴포넌트를 추가할 수 있다.
- **상품 스키마**: `products` 테이블은 id, name, description, price, stock_quantity, category, image_url, created_at으로 최소 구성했다. 향후 재고 이력/카테고리 정규화가 필요하면 별도 테이블로 분리한다.

## 2026-08-31 — 장바구니 구현

- **장바구니를 localStorage에 저장**: 로그인 기능이 아직 없으므로 Zustand `persist` 미들웨어로 브라우저 로컬에 저장한다 (`src/stores/cart-store.ts`). 인증 도입 시 로그인 사용자의 장바구니를 서버(Supabase)로 이전하는 마이그레이션을 고려해야 한다.
- **수량 clamp**: 담기/수량 변경 시 상품의 `stock_quantity`를 넘지 못하도록 스토어 레벨에서 clamp한다. 재고가 줄어드는 경우(다른 사용자가 먼저 구매 등)는 실제 주문 생성 시점에 서버에서 다시 검증해야 한다 — 이번 단계에서는 다루지 않는다.
- **별도 Input 컴포넌트 미도입**: 수량 조절은 shadcn Input 없이 +/- 아이콘 버튼(Button)으로 구현해 의존성을 최소화했다.

## 2026-08-31 — 주문 생성 및 주문 상태 확인 구현

- **비로그인 주문 식별 (guest_id)**: 인증이 아직 없으므로 브라우저별 UUID(`guest_id`)를 `localStorage`에 저장하고 모든 주문에 붙인다 (`src/lib/guest-id.ts`). `orders`/`order_items`의 RLS 정책은 현재 "누구나 읽기/쓰기 가능"으로 열려 있어 `guest_id`를 아는 사람은 누구나 다른 사람의 주문을 조회할 수 있다는 한계가 있다 — Supabase Auth 도입 시 `guest_id`를 `auth.uid()` 기반으로 대체하고 정책을 다시 작성해야 한다. 이번 단계에서는 로그인 없는 MVP 흐름을 우선했다.
- **주문 생성을 DB 함수(RPC)로 원자적으로 처리**: 클라이언트에서 여러 단계로 재고 차감과 주문 생성을 나눠 하면 동시성 문제(경쟁 상태로 재고가 음수가 되는 등)가 생길 수 있어, Postgres 함수 `create_order(guest_id, items)`가 `select ... for update`로 재고를 잠그고 검증한 뒤 `orders`/`order_items`를 생성하도록 했다. 재고 부족 시 함수가 예외를 던지고, Supabase RPC 호출은 이를 에러로 받아 장바구니 화면에 표시한다.
- **주문 상태는 단순 텍스트 코드**: `orders.status`는 `pending`/`confirmed`/`shipped`/`completed`/`cancelled` 중 하나의 텍스트로 관리한다(`src/lib/order-status.ts`에서 한글 라벨 매핑). 상태를 바꾸는 관리자 화면은 다음 단계(관리자 주문 관리)에서 구현하며, 현재는 모든 주문이 생성 시 `pending`으로 시작한다.

## 2026-08-31 — 관리자 상품 등록 구현

- **관리자 인증 없이 먼저 구현**: `/admin/products`는 아직 로그인/권한 검사가 없어 누구나 접근·등록할 수 있다. `products` 테이블에 "누구나 insert 가능" RLS 정책을 추가했다(`supabase/schema.sql`). 이는 임시 조치이며, Supabase Auth 기반 관리자 인증 도입 시 이 정책을 관리자 역할로 제한하고 라우트에 접근 제어를 추가해야 한다.
- **폼 검증은 클라이언트 최소 검증만**: 상품명 필수, 가격/재고는 0 이상의 숫자만 허용하는 정도로 제한했다. 서버(DB) 쪽은 기존 `products` 테이블의 `check (price >= 0)`, `check (stock_quantity >= 0)` 제약으로 이중 방어된다.
- **등록 폼과 목록을 한 화면에 배치**: 별도 상품 목록 관리 화면을 아직 만들지 않았으므로, 등록 직후 확인할 수 있도록 등록 폼 아래에 기존 `getProducts` 쿼리를 재사용해 상품 목록을 함께 보여준다. 수정/삭제는 다음 단계(재고 관리)에서 다룬다.
