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
│   └── cart/             # 장바구니 페이지
├── components/
│   ├── ui/                # shadcn/ui 기반 프리미티브 컴포넌트
│   └── layout/site-header.tsx  # 공통 헤더 (네비게이션 + 장바구니 배지)
├── lib/
│   ├── supabase/client.ts  # Supabase 클라이언트 (환경변수 없으면 null)
│   └── queries/           # TanStack Query에서 사용하는 데이터 fetch 함수
├── providers/             # 전역 Provider (QueryClientProvider 등)
├── stores/                # Zustand 스토어 (product-filter-store, cart-store 등)
└── types/                 # 도메인 타입 정의
supabase/
└── schema.sql             # DB 스키마 및 초기 정책/샘플 데이터
```

## 데이터 흐름

1. UI 컴포넌트가 TanStack Query의 `useQuery`로 `src/lib/queries/*`의 함수를 호출한다.
2. 쿼리 함수는 `src/lib/supabase/client.ts`의 Supabase 클라이언트로 PostgreSQL에 접근한다.
3. Supabase 환경변수가 설정되지 않은 경우 클라이언트는 `null`이 되며, 화면은 "Supabase 연결 필요" 안내를 표시한다 (더미 데이터로 감추지 않는다).
4. 여러 화면에서 공유해야 하는 클라이언트 상태(검색어, 필터, 장바구니 등)는 Zustand 스토어(`src/stores/*`)로 관리한다.
5. 장바구니(`src/stores/cart-store.ts`)는 로그인 기능이 없는 현재 단계에서 `persist` 미들웨어로 브라우저 `localStorage`에 저장된다. 이후 주문 생성 시 이 장바구니 데이터를 기반으로 Supabase에 주문을 생성할 예정이다.

## 다음 단계 (MVP 로드맵)

- 주문 생성 및 주문 상태 확인
- 관리자: 상품 등록/수정, 재고 관리, 주문 관리, 매출 대시보드
- Supabase Auth 기반 관리자 인증
- GA4 이벤트(`view_item`, `add_to_cart`, `begin_checkout`, `purchase`) 계측 및 퍼널 분석
