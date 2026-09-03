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

## 2026-09-01 — 재고 관리 구현

- **재고 관리를 먼저 구현 (주문 관리보다 우선)**: 재고 관리는 기존 `products` 테이블/쿼리 인프라를 그대로 재사용해 필드 하나(`stock_quantity`)만 수정하면 되는 반면, 주문 관리는 새 화면과 상태 변경 UI를 새로 만들어야 해서 상대적으로 범위가 크다. 더 작은 단위부터 처리하기 위해 재고 관리를 먼저 구현했다.
- **재고 수정은 테이블 UPDATE 정책 대신 전용 함수(RPC)로 노출**: 처음에는 상품 등록(insert)과 동일하게 "누구나 update 가능" RLS 정책을 `products`에 걸었으나, RLS는 컬럼 단위 제한이 불가능해 그 정책이 `stock_quantity` 외에 `price`/`name` 등 모든 컬럼까지 열어버린다는 문제가 코드 리뷰로 드러났다. 대신 `create_order`와 같은 패턴으로 `update_product_stock(product_id, stock_quantity)` 함수(SECURITY DEFINER)만 노출해 재고 수량 외 컬럼은 수정할 수 없도록 막았다. 이 함수 자체도 관리자 인증이 없는 현재 단계의 임시 조치이며(누구나 호출 가능), Supabase Auth 도입 시 호출 권한을 관리자 역할로 제한해야 한다.
- **행 단위 즉시 저장, 별도 "저장" 버튼 없음**: `/admin/inventory`에서 +/- 버튼은 클릭 즉시 DB에 반영되고, 직접 입력한 값은 입력 필드에서 포커스를 벗어날 때(`onBlur`) 저장된다. 여러 행을 한 번에 편집하고 일괄 저장하는 방식보다 구현이 단순하고, 실수로 값을 남겨둔 채 페이지를 벗어나는 일을 줄인다.
- **쿼리 키 공유**: 재고 수정 후 `["products"]` 쿼리를 무효화하므로, 같은 키를 쓰는 `/products`, `/admin/products` 화면도 재방문 시 최신 재고를 보여준다. 여러 관리자가 동시에 수정하는 동시성 문제는 이번 단계에서 다루지 않는다(단일 관리자 사용을 가정).

## 2026-09-02 — 관리자 주문 관리 구현

- **관리자 인증 없이 전체 주문 열람/상태 변경 가능**: `/admin/orders`는 `getAllOrders`로 `guest_id` 필터 없이 모든 주문을 조회하고, 누구나 상태를 바꿀 수 있다. 관리자 인증이 아직 없기 때문에 생기는 근본적인 한계로, `create_order`/`createProduct`의 insert 정책/`update_product_stock`과 동일한 원인이다. Supabase Auth 도입 시 관리자 역할 기반 접근 제어로 대체해야 한다.
- **재고 관리와 동일하게 전용 함수(RPC)로 상태만 변경**: 처음에는 `orders`의 기존 "누구나 read/write 가능" 정책을 그대로 이용해 `status`만 직접 update하면 된다고 생각했으나, 코드 리뷰(CodeRabbit)에서 그 permissive 정책(`for all using(true) with check(true)`)이 `status` 외에 `guest_id`, `total_amount` 등 다른 컬럼까지 클라이언트가 임의로 바꿀 수 있게 열어준다는 점이 지적됐다. `update_product_stock`과 동일한 패턴으로 `update_order_status(order_id, status)` 함수(SECURITY DEFINER)를 추가하고, `orders` 테이블의 정책은 select만 남기도록 좁혔다. `create_order`/`update_order_status` 모두 SECURITY DEFINER 함수를 통해서만 쓰기가 이뤄지므로 테이블에 별도 insert/update 정책은 필요 없다.
- **목록 화면만 구현, 별도 상세 페이지 없음**: 재고 관리와 동일하게 행 단위로 상태를 즉시 저장하는 목록 화면만 만들었다. 주문 품목(주문 아이템) 상세가 필요하면 기존 고객용 `/orders/[id]` 페이지로 확인할 수 있어 별도 관리자 상세 페이지는 만들지 않았다.
- **쿼리 키 분리**: 고객용 `/orders`는 `guest_id`로 스코프된 `["orders"]` 쿼리를 쓰므로, 전체 주문을 담는 관리자 목록은 캐시가 섞이지 않도록 `["admin-orders"]`라는 별도 키를 사용한다.

## 2026-09-03 — 관리자 상품 수정/삭제 구현

- **재고 관리/주문 관리와 동일한 RPC 패턴 재사용**: `products` 테이블에 update/delete RLS 정책을 열지 않고, `update_product_stock`/`update_order_status`와 같은 패턴으로 `update_product(product_id, ...)`, `delete_product(product_id)` 함수(SECURITY DEFINER)만 노출했다. permissive한 update/delete 정책은 의도한 컬럼 외에도 클라이언트가 임의로 값을 바꿀 수 있게 열어버린다는 점이 이전 두 기능에서 반복적으로 드러난 문제라, 처음부터 RPC로 시작했다.
- **삭제 차단은 FK 에러 캐치 대신 사전 존재 확인**: `order_items.product_id`가 `products.id`를 FK로 참조하고(ON DELETE 지정 없음), 주문 이력이 있는 상품을 그냥 삭제하면 Postgres가 FK 위반 에러를 던진다. 이 에러를 그대로 노출하는 대신, `delete_product` 함수가 `order_items`에 참조가 있는지 먼저 확인해 "주문 내역이 있어 삭제할 수 없습니다"라는 명확한 한글 메시지를 던지도록 했다. 소프트 삭제(`is_deleted` 컬럼 등)는 모든 상품 조회 쿼리에 필터를 추가해야 해서 범위가 커지므로 이번 단계에서는 채택하지 않았다 — 삭제 자체를 막는 것으로 충분하다고 판단했다.
- **Dialog 컴포넌트를 직접 작성, 최소한의 접근성 처리 포함**: 수정/삭제 확인에 쓸 모달이 아직 없어 `src/components/ui/dialog.tsx`를 새로 만들었다. `ui.shadcn.com` 레지스트리에 접근할 수 없어 다른 컴포넌트들처럼 직접 작성했다. Radix 같은 라이브러리는 쓰지 않지만(애니메이션 등은 생략), 코드 리뷰(CodeRabbit)에서 지적된 대로 `role="dialog"`/`aria-modal`/`aria-labelledby`, 최초 포커스 이동, Tab 포커스 트랩, Escape 닫기, 닫을 때 이전 포커스 복원은 직접 구현했다 — 이건 접근성 관점에서 최소 요구사항이라 생략하지 않았다. 별도 AlertDialog 없이 삭제 확인도 같은 Dialog로 처리한다.
- **ProductForm 공유로 폼 중복 최소화**: 상품 등록 폼과 동일한 6개 필드(이름/설명/가격/재고/카테고리/이미지 URL)가 수정 폼에도 필요해, 기존 인라인 폼 JSX를 `ProductForm` 서브컴포넌트로 추출해 등록/수정 화면에서 재사용했다. 별도 파일로 분리하지 않고 페이지 내부에 로컬로 두었다(`inventory/page.tsx`의 `InventoryRow`와 동일한 방식).

## 2026-09-03 — 관리자 매출 대시보드 구현

- **클라이언트 집계, DB 집계 없음**: 현재 데이터 규모(수십~수백 건)에서는 전체 `orders`/`order_items`를 읽어와 `src/lib/dashboard-metrics.ts`의 순수 함수(`computeDashboardMetrics`)로 계산하는 편이 GROUP BY 뷰/RPC를 새로 만드는 것보다 단순하다. 데이터가 커지면 이후 단계에서 DB 쪽 집계로 옮기는 것을 고려한다.
- **취소된 주문은 매출/주문 수 집계에서 제외**: `cancelled` 상태 주문은 실현된 매출이 아니므로 총 매출, 총 주문 수, 일별 매출, 인기 상품 계산 모두에서 제외한다.
- **최근 14일 / 인기 상품 TOP 5로 고정**: 날짜 범위 선택기 없이 최근 14일 고정 윈도우로 추이를 보여주고, 인기 상품도 매출 기준 상위 5개로 고정했다. 범위가 커지면 이후 단계에서 기간 선택 UI를 추가한다.
- **차트 라이브러리로 recharts 도입**: 프로젝트에 차트 라이브러리가 없어 recharts를 신규 설치했다. Tailwind 테마 변수 연동 없이 고정 색상을 사용해 최소 구현으로 시작했다.
