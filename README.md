# personal-Saas-project

소규모 사업자를 위한 주문·재고 관리 서비스 제작 (+GA4 활용)

작은 카페/헬스장/동아리 운영자가 엑셀로 관리하던 주문과 재고를 웹 서비스로 대체하는 것을 목표로 합니다.

## MVP 기능

### 사용자 영역
- 상품 조회 ✅ (구현됨)
- 장바구니 ✅ (구현됨)
- 주문 ✅ (구현됨)
- 주문 상태 확인 ✅ (구현됨)

### 관리자 영역
- 상품 등록 ✅ (구현됨)
- 재고 관리
- 주문 관리
- 매출 대시보드

## 기술 스택

- **Frontend**: Next.js, TypeScript, TanStack Query, Zustand, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Analytics**: GA4, Microsoft Clarity
- **배포**: Vercel (Frontend), Supabase (DB)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 Supabase 프로젝트 정보를 입력합니다.

```bash
cp .env.example .env.local
```

Supabase 프로젝트가 아직 없다면 [supabase.com](https://supabase.com)에서 새 프로젝트를 만들고,
프로젝트 설정 → API 메뉴에서 URL과 anon key를 확인해 채워 넣으세요.

### 3. 데이터베이스 스키마 적용

Supabase SQL Editor에서 `supabase/schema.sql`을 실행해 `products`, `orders`, `order_items` 테이블(및 샘플 데이터, 주문 생성용 `create_order` 함수)을 생성합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000/products`에서 상품 조회 화면을 확인할 수 있습니다.
환경변수가 설정되지 않은 경우 "Supabase 연결이 필요합니다" 안내가 표시됩니다.

상품 목록에서 "담기" 버튼을 누르면 장바구니(`/cart`)에 담기며, 장바구니 내용은
로그인 없이 브라우저의 `localStorage`에 저장됩니다.

장바구니에서 "주문하기"를 누르면 주문이 생성되고 재고가 차감되며, `/orders`에서
이 브라우저로 진행한 주문 내역과 상태를 확인할 수 있습니다. 로그인 기능이 없으므로
브라우저별 `guest_id`(localStorage)로 주문을 구분합니다.

`/admin/products`에서 새 상품을 등록할 수 있습니다. 관리자 인증이 아직 없어
누구나 접근/등록 가능한 상태입니다 (`docs/decision-log.md` 참고).

## 문서

- [아키텍처 개요](docs/architecture.md)
- [의사결정 기록](docs/decision-log.md)
- [트러블슈팅](docs/troubleshooting.md)

## 다음 단계

관리자(재고 관리/주문 관리/매출 대시보드) → Supabase Auth 기반 인증 →
GA4 이벤트 계측 및 전환 퍼널 분석 순으로 확장할 예정입니다.
