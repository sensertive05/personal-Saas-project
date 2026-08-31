# 의사결정 기록

## 2026-08-31 — 프로젝트 뼈대 및 상품 조회 MVP

- **인증 범위 제외**: 이번 단계에서는 로그인/인증을 구현하지 않는다. 상품 조회는 비로그인 상태에서도 가능해야 하므로, `products` 테이블 RLS 정책을 "누구나 조회 가능"으로 설정했다. 관리자 인증 및 쓰기 권한 제어는 다음 단계에서 다룬다.
- **Supabase 미연결 상태 처리**: Supabase 프로젝트가 아직 없는 상태로 개발을 시작했다. 목업 데이터로 화면을 숨기지 않고, 환경변수가 없으면 명시적으로 "Supabase 연결 필요" 안내를 보여주도록 했다. 이렇게 하면 실제 연결 시 별도 코드 수정 없이 바로 동작한다.
- **shadcn/ui 컴포넌트 직접 작성**: 네트워크 정책상 `ui.shadcn.com` 레지스트리에 접근할 수 없어 CLI(`shadcn add`)를 사용하지 못했다. 대신 표준 shadcn/ui 컴포넌트 코드(button, card, table, skeleton, badge)를 직접 작성했다. 추후 네트워크가 허용되는 환경에서 `npx shadcn@latest add <component>`로 다른 컴포넌트를 추가할 수 있다.
- **상품 스키마**: `products` 테이블은 id, name, description, price, stock_quantity, category, image_url, created_at으로 최소 구성했다. 향후 재고 이력/카테고리 정규화가 필요하면 별도 테이블로 분리한다.
