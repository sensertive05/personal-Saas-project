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
