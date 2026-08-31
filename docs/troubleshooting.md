# 트러블슈팅

## "Supabase 연결이 필요합니다" 안내가 계속 보여요

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수가 설정되지 않은 상태입니다.

1. Supabase 프로젝트를 생성합니다.
2. 프로젝트 설정 → API에서 URL과 anon key를 확인합니다.
3. 저장소 루트에 `.env.local` 파일을 만들고 `.env.example`을 참고해 값을 채웁니다.
4. `supabase/schema.sql`을 Supabase SQL Editor에서 실행해 `products` 테이블을 생성합니다.
5. 개발 서버를 재시작합니다 (`npm run dev`).

## 상품 목록이 비어 있어요

`products` 테이블에 데이터가 없는 상태입니다. `supabase/schema.sql`의 샘플 `insert` 구문을 실행하거나, Supabase Table Editor에서 직접 데이터를 추가하세요.

## `npx shadcn add` 명령이 실패해요

`ui.shadcn.com` 레지스트리에 대한 네트워크 접근이 제한된 환경(예: 사내망, 샌드박스)일 수 있습니다. 이 경우 `src/components/ui/`에 필요한 컴포넌트 코드를 직접 추가하거나, 네트워크 제약이 없는 환경에서 CLI를 실행한 뒤 결과 파일만 복사해오세요.
